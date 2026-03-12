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

    console.log("[v0] Inpaint request: prompt =", prompt)

    // Use Runware's imageMasking endpoint for object removal
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
          maskPrompt: prompt,
          outputType: "URL",
          outputFormat: "jpg",
          deliveryMethod: "sync",
        },
      ]),
    })

    console.log("[v0] Runware imageMasking response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Runware error:", errorText)
      return NextResponse.json(
        { error: `Runware API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] Response structure:", typeof data, Array.isArray(data))

    // Extract result from response
    let result = null
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0]
    }

    if (!result) {
      console.error("[v0] No result in response:", JSON.stringify(data).substring(0, 200))
      return NextResponse.json(
        { error: "No result returned from Runware" },
        { status: 500 }
      )
    }

    console.log("[v0] Result keys:", Object.keys(result))

    // Check for maskImageURL (the edited image from imageMasking)
    if (result.maskImageURL) {
      console.log("[v0] Successfully removed object, mask image URL:", result.maskImageURL)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.maskImageURL,
        },
      })
    }

    // Fallback to imageURL
    if (result.imageURL) {
      console.log("[v0] Using imageURL from result")
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.imageURL,
        },
      })
    }

    console.error("[v0] No image URL found. Result:", JSON.stringify(result).substring(0, 300))
    return NextResponse.json(
      { error: "No image URL in response" },
      { status: 500 }
    )
  } catch (error) {
    console.error("[v0] Inpaint error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Inpaint failed" },
      { status: 500 }
    )
  }
}
