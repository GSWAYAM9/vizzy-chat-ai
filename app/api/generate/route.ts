import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import Groq from "groq-sdk"

// Runware API endpoint for image generation
const RUNWARE_API_ENDPOINT = "https://api.runware.ai/v1"
const MAX_POLL_ATTEMPTS = 120
const POLL_INTERVAL_MS = 1000

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

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
    let {
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

    console.log("[v0] Original prompt:", prompt)

    // Refine the prompt using Groq AI
    const refinedPrompt = await refinePromptWithGroq(prompt)
    console.log("[v0] Refined prompt:", refinedPrompt)

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
    console.log("[v0] Payload: prompt length=", refinedPrompt.trim().length, "dimensions=", `${width}x${height}`, "count=", count)

    // Fire multiple requests in parallel for multiple results
    const requests = Array.from({ length: count }, () => {
      const taskUUID = uuidv4()
      const payload = {
        taskType: "imageInference",
        taskUUID,
        outputType: "URL",
        outputFormat: "jpg",
        positivePrompt: refinedPrompt.trim(),
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
      prompt: refinedPrompt.trim(),
    })
  } catch (error) {
    console.error("[Generate API Error]", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}

async function refinePromptWithGroq(userPrompt: string): Promise<string> {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log("[v0] No Groq API key, using original prompt")
      return userPrompt
    }

    // Check if this is an iterative prompt (contains "Modification:" or "similar variation")
    const isIterative = userPrompt.includes("Modification:") || userPrompt.includes("similar variation")
    
    let systemPrompt = `You are an expert AI image prompt engineer for Runware image generation. Your task is to transform user requests into detailed, vivid image generation prompts that will produce beautiful, high-quality results.

Transform this user request into a detailed image generation prompt. Focus on:
- Visual style and artistic direction (e.g., "oil painting", "digital art", "photography", "3D rendered")
- Composition and framing
- Color palette and mood
- Lighting and atmosphere
- Technical details (quality, resolution hints if relevant)
- Any specific art movements or references

Keep it concise but descriptive (under 150 words). Return ONLY the refined prompt, nothing else.`

    if (isIterative) {
      systemPrompt = `You are an expert AI image prompt engineer. The user is iterating on a previous image and wants a variation or modification.

If they said "Modification:", apply their requested changes to the base prompt while keeping the core elements intact.
If they said "similar variation", create a subtle variation that maintains the essence but adds fresh creative elements.

Keep the base concept and style but incorporate the user's feedback. Return ONLY the refined prompt, nothing else (under 150 words).`
    }

    const message = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}

User request: "${userPrompt}"`,
        },
      ],
    })

    if (message.choices[0].message.content) {
      return message.choices[0].message.content.trim()
    }

    return userPrompt
  } catch (error) {
    console.error("[v0] Error refining prompt with Groq:", error)
    return userPrompt
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

  // Runware wraps response in { data: [...] } format
  let responseArray = null
  if (data.data && Array.isArray(data.data)) {
    responseArray = data.data
  } else if (Array.isArray(data)) {
    responseArray = data
  }

  if (!responseArray || responseArray.length === 0) {
    console.error("[v0] Unexpected response format from Runware")
    throw new Error("Unexpected response format from Runware API")
  }

  const result = responseArray[0]

  // Check for immediate completion - imageURL means sync response already succeeded
  if (result.imageURL) {
    console.log("[v0] Image generated successfully")
    return {
      url: result.imageURL,
      seed: result.seed,
    }
  }

  // For sync delivery, we should always get imageURL immediately
  // If we don't have it, the generation failed
  console.error("[v0] No imageURL in sync response")
  throw new Error("Image generation failed: no image URL in response")
}

