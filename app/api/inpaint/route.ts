import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, prompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.RUNWARE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "RUNWARE_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const payload = {
      taskType: "imageMasking",
      taskUUID: crypto.randomUUID(),
      inputImage: imageUrl,
      maskPrompt: prompt,
      outputType: "URL",
      outputFormat: "jpg",
      deliveryMethod: "sync",
    }

    const response = await fetch("https://api.runware.ai/v1/imageMasking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([payload]),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Runware error:", response.status, errorText)
      return NextResponse.json(
        { error: `Runware API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    let result = null

    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0]
    }

    if (!result || !result.maskImageURL) {
      console.error("[v0] No maskImageURL in response")
      return NextResponse.json(
        { error: "No edited image returned from Runware" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      editedImage: {
        url: result.maskImageURL,
      },
    })
  } catch (error) {
    console.error("[v0] Inpaint error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Inpainting failed" },
      { status: 500 }
    )
  }
}
