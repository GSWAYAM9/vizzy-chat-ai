import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const RUNWARE_API_ENDPOINT = "https://api.runware.ai/v1"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RUNWARE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "RUNWARE_API_KEY not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { imageUrl, prompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt required" },
        { status: 400 }
      )
    }

    const taskUUID = uuidv4()

    const response = await fetch(`${RUNWARE_API_ENDPOINT}/imageMasking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([
        {
          taskType: "imageMasking",
          taskUUID,
          inputImage: imageUrl,
          maskPrompt: prompt,
          outputType: "URL",
          outputFormat: "jpg",
          deliveryMethod: "sync",
        },
      ]),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Runware error:", error)
      return NextResponse.json(
        { error: "Image editing failed" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const result = data.data?.[0] || data[0]

    if (!result) {
      return NextResponse.json(
        { error: "Invalid response from Runware" },
        { status: 500 }
      )
    }

    if (result.maskImageURL) {
      return NextResponse.json({
        success: true,
        editedImage: { url: result.maskImageURL },
      })
    }

    return NextResponse.json(
      { error: "No edited image in response" },
      { status: 500 }
    )
  } catch (error) {
    console.error("[v0] Inpaint error:", error)
    return NextResponse.json(
      { error: "Image editing failed" },
      { status: 500 }
    )
  }
}
