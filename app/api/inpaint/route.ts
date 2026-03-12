import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const RUNWARE_API_ENDPOINT = "https://api.runware.ai/v1"
const MAX_POLL_ATTEMPTS = 120
const POLL_INTERVAL_MS = 1000

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RUNWARE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "RUNWARE_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { imageUrl, prompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    console.log("[v0] Inpaint called with prompt:", prompt)

    const taskUUID = uuidv4()

    const payload = {
      taskType: "imageMasking",
      taskUUID,
      inputImage: imageUrl,
      maskPrompt: prompt.trim(),
      outputType: "URL",
      outputFormat: "jpg",
      deliveryMethod: "sync",
    }

    const response = await fetch(`${RUNWARE_API_ENDPOINT}/imageMasking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([payload]),
    })

    console.log("[v0] Runware response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Runware error:", response.status, errorText)
      throw new Error(`Runware error: ${errorText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Unexpected Runware response format")
    }

    const result = data[0]

    if (result.status === "succeeded" && result.imageURL) {
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.imageURL,
        },
      })
    }

    if (result.taskUUID) {
      const editedUrl = await pollForResult(apiKey, result.taskUUID)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: editedUrl,
        },
      })
    }

    throw new Error("Failed to process image")
  } catch (error) {
    console.error("[Inpaint Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image editing failed" },
      { status: 500 }
    )
  }
}

async function pollForResult(apiKey: string, taskUUID: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(`${RUNWARE_API_ENDPOINT}/getResponse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ taskUUID }),
    })

    if (!response.ok) {
      continue
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      continue
    }

    const result = data[0]

    if (result.status === "succeeded" && result.imageURL) {
      return result.imageURL
    }

    if (result.status === "failed") {
      throw new Error("Image editing failed")
    }
  }

  throw new Error("Image editing timed out")
}
