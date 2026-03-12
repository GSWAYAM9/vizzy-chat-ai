import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Runware imageMasking endpoint for object removal and image editing
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

    console.log("[v0] Runware image editing called with prompt:", prompt)

    const taskUUID = uuidv4()
    
    // Use imageMasking task type for object removal/editing
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
      console.error("[v0] Runware API Error:", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again." },
          { status: 429 }
        )
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your RUNWARE_API_KEY." },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: `Image editing failed: ${errorText}` },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Unexpected response format from Runware API" },
        { status: 500 }
      )
    }

    const result = data[0]

    // Check for immediate success
    if (result.status === "succeeded" && result.imageURL) {
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.imageURL,
        },
      })
    }

    // Poll for async result
    if (result.taskUUID) {
      const editedUrl = await pollForResult(apiKey, result.taskUUID)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: editedUrl,
        },
      })
    }

    return NextResponse.json(
      { error: "Failed to extract edited image from response" },
      { status: 500 }
    )
  } catch (error) {
    console.error("[Image Editing API Error]", error)
    return NextResponse.json(
      { error: "An unexpected error occurred during image editing." },
      { status: 500 }
    )
  }
}

async function pollForResult(
  apiKey: string,
  taskUUID: string
): Promise<string> {
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
      throw new Error(result.error || "Image editing failed")
    }
  }

  throw new Error("Image editing timed out")
}
