import { NextRequest, NextResponse } from "next/server"

const RUNWARE_API_ENDPOINT = "https://api.runware.ai/v1"

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

    console.log("[v0] Inpaint request:", prompt)

    // Use imageMasking for object removal
    const response = await fetch(`${RUNWARE_API_ENDPOINT}/imageMasking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([
        {
          taskType: "imageMasking",
          inputImage: imageUrl,
          maskPrompt: prompt.trim(),
          outputType: "URL",
        },
      ]),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Runware error:", data)
      throw new Error(data.errors?.[0]?.message || "Failed to process image")
    }

    // Extract result from wrapped response
    const result = data.data?.[0] || data[0]
    if (!result || !result.maskImageURL) {
      console.error("[v0] No maskImageURL in response:", result)
      throw new Error("Failed to generate edited image")
    }

    return NextResponse.json({
      success: true,
      editedImage: {
        url: result.maskImageURL,
      },
    })
  } catch (error) {
    console.error("[Inpaint Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image editing failed" },
      { status: 500 }
    )
  }
}
