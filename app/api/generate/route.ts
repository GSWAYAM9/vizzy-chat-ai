import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Runware API endpoint for image generation
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
    const {
      prompt,
      negative_prompt,
      num_results = 1,
      aspect_ratio = "1:1",
      seed,
    } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      )
    }

    // Convert aspect ratio to width/height
    const aspectRatioMap: Record<string, [number, number]> = {
      "1:1": [1024, 1024],
      "2:3": [768, 1152],
      "3:2": [1152, 768],
      "3:4": [768, 1024],
      "4:3": [1024, 768],
      "4:5": [800, 1000],
      "5:4": [1000, 800],
      "9:16": [576, 1024],
      "16:9": [1024, 576],
    }

    const [width, height] = aspectRatioMap[aspect_ratio] || [1024, 1024]
    const count = Math.min(Math.max(num_results, 1), 4)

    console.log("[v0] Runware generate called")
    console.log("[v0] Payload: prompt length=", prompt.trim().length, "dimensions=", `${width}x${height}`, "count=", count)

    // Fire multiple requests in parallel for multiple results
    const requests = Array.from({ length: count }, () => {
      const taskUUID = uuidv4()
      const payload = {
        taskType: "imageInference",
        taskUUID,
        outputType: "URL",
        outputFormat: "jpg",
        positivePrompt: prompt.trim(),
        width,
        height,
        model: "runware:101@1",
        steps: 30,
        CFGScale: 7.5,
        numberResults: 1,
        deliveryMethod: "sync",
      }

      if (negative_prompt) {
        payload.negativePrompt = negative_prompt
      }

      return generateSingleImage(apiKey, payload)
    })

    const results = await Promise.allSettled(requests)

    const images: { url: string; seed?: number }[] = []
    let lastError = ""

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        images.push(result.value)
      } else if (result.status === "rejected") {
        lastError = result.reason?.message || "Generation failed"
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: lastError || "All image generation requests failed." },
        { status: 500 }
      )
    }

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

interface GeneratePayload {
  taskType: string
  taskUUID: string
  outputType: string
  outputFormat: string
  positivePrompt: string
  width: number
  height: number
  model: string
  steps: number
  CFGScale: number
  numberResults: number
  deliveryMethod: string
  negativePrompt?: string
}

async function generateSingleImage(
  apiKey: string,
  payload: GeneratePayload
): Promise<{ url: string; seed?: number }> {
  console.log("[v0] Fetching from Runware with UUID:", payload.taskUUID)

  const response = await fetch(`${RUNWARE_API_ENDPOINT}/imageInference`, {
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
      throw new Error("Rate limit exceeded. Please wait a moment and try again.")
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid API key. Please check your RUNWARE_API_KEY.")
    }
    throw new Error(`Image generation failed: ${errorText}`)
  }

  const data = await response.json()
  console.log("[v0] Full response data:", JSON.stringify(data).substring(0, 500))

  // Runware wraps response in { data: [...] } format
  let responseArray = null
  if (data.data && Array.isArray(data.data)) {
    responseArray = data.data
  } else if (Array.isArray(data)) {
    responseArray = data
  }

  if (!responseArray || responseArray.length === 0) {
    console.error("[v0] Unexpected response format:", JSON.stringify(data).substring(0, 300))
    throw new Error("Unexpected response format from Runware API")
  }

  const result = responseArray[0]

  console.log("[v0] Result keys:", Object.keys(result))
  console.log("[v0] Result:", JSON.stringify(result).substring(0, 300))
  console.log("[v0] Has imageURL:", !!result.imageURL)
  console.log("[v0] Has taskUUID:", !!result.taskUUID)

  // Check for immediate completion - imageURL means sync response already succeeded
  if (result.imageURL) {
    console.log("[v0] Image already available from sync response")
    return {
      url: result.imageURL,
      seed: result.seed,
    }
  }

  // For sync delivery, we should always get imageURL immediately
  // If we don't have it, the generation failed - don't attempt polling
  console.error("[v0] No imageURL in sync response. Result:", JSON.stringify(result).substring(0, 300))
  throw new Error("Image generation failed: no image URL in response")
}
