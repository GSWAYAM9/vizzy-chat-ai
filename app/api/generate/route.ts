import { NextRequest, NextResponse } from "next/server"

const BRIA_V2_BASE = "https://engine.prod.bria-api.com/v2"
const GENERATE_URL = `${BRIA_V2_BASE}/image/generate`
const MAX_POLL_ATTEMPTS = 60
const POLL_INTERVAL_MS = 2000

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
      seed,
    } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      )
    }

    const validAspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9"]
    const finalAspectRatio = validAspectRatios.includes(aspect_ratio) ? aspect_ratio : "1:1"
    const count = Math.min(Math.max(num_results, 1), 4)

    // V2 returns one result per request, so we fire multiple in parallel
    const requests = Array.from({ length: count }, () => {
      const briaPayload: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspect_ratio: finalAspectRatio,
        sync: true,
        steps_num: 50,
        guidance_scale: 5,
      }
      if (negative_prompt) {
        briaPayload.negative_prompt = negative_prompt
      }
      if (seed !== undefined) {
        briaPayload.seed = seed
      }

      return generateSingleImage(apiKey, briaPayload)
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

async function generateSingleImage(
  apiKey: string,
  payload: Record<string, unknown>
): Promise<{ url: string; seed?: number }> {
  const response = await fetch(GENERATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_token: apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Bria API Error]", response.status, errorText)

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.")
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid API key. Please check your BRIA_API_KEY.")
    }
    throw new Error(`Image generation failed: ${errorText}`)
  }

  const data = await response.json()

  // Sync mode: result comes directly with status 200
  if (data.result?.image_url) {
    return {
      url: data.result.image_url,
      seed: data.result.seed,
    }
  }

  // If we got result array (legacy format compatibility)
  if (data.result && Array.isArray(data.result)) {
    const first = data.result[0]
    return {
      url: first?.urls?.[0] || first?.image_url || "",
      seed: first?.seed,
    }
  }

  // Async mode: poll status_url
  if (data.request_id && data.status_url) {
    return pollForResult(apiKey, data.status_url)
  }

  throw new Error("Unexpected response format from Bria API")
}

async function pollForResult(
  apiKey: string,
  statusUrl: string
): Promise<{ url: string; seed?: number }> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const statusResponse = await fetch(statusUrl, {
      headers: {
        api_token: apiKey,
      },
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error("[Bria Status Error]", statusResponse.status, errorText)
      continue
    }

    const statusData = await statusResponse.json()

    if (statusData.status === "COMPLETED") {
      return {
        url: statusData.result?.image_url || "",
        seed: statusData.result?.seed,
      }
    }

    if (statusData.status === "FAILED") {
      throw new Error(statusData.error || "Image generation failed on Bria's side.")
    }

    // Still processing, continue polling
  }

  throw new Error("Image generation timed out. Please try again.")
}
