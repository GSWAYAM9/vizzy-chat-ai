import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt } = await request.json()

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    // For now, use Runware's imageInference for editing
    // True inpainting would require mask-based removal
    const apiKey = process.env.RUNWARE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "RUNWARE_API_KEY not configured" },
        { status: 500 }
      )
    }

    const editPrompt = `${prompt}. Keep the professional quality and original style.`

    const response = await fetch("https://api.runware.ai/v1/imageInference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([
        {
          taskType: "imageInference",
          positivePrompt: editPrompt,
          width: 1024,
          height: 1024,
          model: "runware:101@1",
          steps: 30,
          CFGScale: 7.5,
          outputFormat: "jpg",
          deliveryMethod: "sync",
        },
      ]),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Runware API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const result = data.data?.[0] || data[0]

    if (result?.imageURL) {
      return NextResponse.json({
        success: true,
        editedImage: { url: result.imageURL },
      })
    }

    return NextResponse.json(
      { error: "No image URL in response" },
      { status: 500 }
    )
  } catch (error) {
    console.error("[Inpaint Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image editing failed" },
      { status: 500 }
    )
  }
}
