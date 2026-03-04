import { NextRequest, NextResponse } from "next/server"

const BRIA_API_URL = "https://engine.prod.bria-api.com/v1/text-to-image/hd/create"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BRIA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "BRIA_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      prompt,
      negative_prompt,
      num_results = 1,
      aspect_ratio = "1:1",
      sync = true,
    } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      )
    }

    const briaPayload: Record<string, unknown> = {
      prompt: prompt.trim(),
      num_results: Math.min(Math.max(num_results, 1), 4),
      sync,
      text_to_image_model_id: "hd",
    }

    if (negative_prompt) {
      briaPayload.negative_prompt = negative_prompt
    }

    // Map user-friendly aspect ratios to pixel dimensions
    const dimensionMap: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1536, height: 864 },
      "9:16": { width: 864, height: 1536 },
      "3:2": { width: 1536, height: 1024 },
      "2:3": { width: 1024, height: 1536 },
      "4:3": { width: 1365, height: 1024 },
      "3:4": { width: 1024, height: 1365 },
    }

    const dims = dimensionMap[aspect_ratio] || dimensionMap["1:1"]
    briaPayload.width = dims.width
    briaPayload.height = dims.height

    const response = await fetch(BRIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_token: apiKey,
      },
      body: JSON.stringify(briaPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Bria API Error]", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        )
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your BRIA_API_KEY." },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: `Image generation failed: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // The Bria API returns result array with image URLs
    const images =
      data.result?.map((item: { urls: string[]; seed?: number }) => ({
        url: item.urls?.[0] || "",
        seed: item.seed,
      })) || []

    return NextResponse.json({
      images,
      prompt: prompt.trim(),
    })
  } catch (error) {
    console.error("[Generate API Error]", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
