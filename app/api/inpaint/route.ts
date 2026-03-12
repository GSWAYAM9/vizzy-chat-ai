import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const RUNWARE_API = "https://api.runware.ai/v1"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RUNWARE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "RUNWARE_API_KEY not configured" }, { status: 500 })
    }

    const { imageUrl, prompt } = await request.json()
    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: "Missing imageUrl or prompt" }, { status: 400 })
    }

    const taskUUID = uuidv4()
    const payload = {
      taskType: "imageInference",
      taskUUID,
      outputType: "URL",
      outputFormat: "jpg",
      positivePrompt: prompt.trim(),
      width: 1024,
      height: 1024,
      model: "runware:101@1",
      steps: 30,
      CFGScale: 7.5,
      numberResults: 1,
      deliveryMethod: "sync",
    }

    const response = await fetch(`${RUNWARE_API}/imageInference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([payload]),
    })

    if (!response.ok) {
      throw new Error(`Runware error: ${response.status}`)
    }

    const data = await response.json()
    const result = Array.isArray(data) ? data[0] : data?.data?.[0] || data

    if (result?.imageURL) {
      return NextResponse.json({
        success: true,
        editedImage: { url: result.imageURL },
      })
    }

    if (result?.taskUUID) {
      const imageUrl = await poll(apiKey, result.taskUUID)
      return NextResponse.json({
        success: true,
        editedImage: { url: imageUrl },
      })
    }

    throw new Error("No image returned")
  } catch (error) {
    console.error("Inpaint error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    )
  }
}

async function poll(apiKey: string, taskUUID: string): Promise<string> {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 1000))

    const res = await fetch(`${RUNWARE_API}/getResponse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ taskUUID }),
    })

    if (!res.ok) continue

    const data = await res.json()
    const result = Array.isArray(data) ? data[0] : data?.data?.[0] || data

    if (result?.imageURL) return result.imageURL
    if (result?.status === "failed") throw new Error("Generation failed")
  }

  throw new Error("Poll timeout")
}
