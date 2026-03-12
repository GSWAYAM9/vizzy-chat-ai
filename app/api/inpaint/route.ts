import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Runware image generation endpoint - used for creating edited versions
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
    const { imageUrl, prompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    console.log("[v0] Image editing called with prompt:", prompt)

    const taskUUID = uuidv4()
    
    // Instead of using imageMasking (which doesn't work well for general object removal),
    // use the regular image generation endpoint to create a new image based on the editing request
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

    console.log("[v0] Sending image generation request to Runware")

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
      throw new Error(`Image generation failed: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] Response data:", JSON.stringify(data).substring(0, 300))

    // Handle wrapped response
    let result = null
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0]
    }

    if (!result) {
      throw new Error(`Unexpected response format`)
    }

    // Check for imageURL from generation
    if (result.imageURL) {
      console.log("[v0] Image generated successfully:", result.imageURL)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.imageURL,
        },
      })
    }

    // If async, poll for result
    if (result.taskUUID) {
      console.log("[v0] Polling for result")
      const generatedUrl = await pollForResult(apiKey, result.taskUUID)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: generatedUrl,
        },
      })
    }

    throw new Error(`Failed to generate edited image`)
  } catch (error) {
    console.error("[Image Editing Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image editing failed" },
      { status: 500 }
    )
  }
}

async function pollForResult(apiKey: string, taskUUID: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(`${RUNWARE_API_ENDPOINT}/getResponse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ taskUUID }),
    })

    if (!response.ok) {
      continue
    }

    const data = await response.json()

    // Handle wrapped response
    let result = null
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0]
    }

    if (!result) {
      continue
    }

    if (result.imageURL) {
      return result.imageURL
    }

    if (result.status === "failed") {
      throw new Error("Image generation failed")
    }
  }

  throw new Error("Image generation timed out")
}

    const body = await request.json()
    const { imageUrl, prompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    console.log("[v0] Inpaint called with prompt:", prompt)

    const taskUUID = uuidv4()

    const payload = {
      taskType: "imageMasking",
      taskUUID,
      inputImage: imageUrl,
      maskPrompt: prompt.trim(),
      outputType: "URL",
      outputFormat: "jpg",
      deliveryMethod: "sync",
    }

    const response = await fetch(`${RUNWARE_API_ENDPOINT}/imageMasking`, {
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
      console.error("[v0] Runware error:", response.status, errorText)
      throw new Error(`Runware error: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] Runware response data:", JSON.stringify(data).substring(0, 500))

    // Runware wraps response in a 'data' array
    let result = null
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0]
    } else if (typeof data === 'object' && data !== null) {
      result = data
    }

    if (!result) {
      throw new Error(`Unexpected Runware response format: ${JSON.stringify(data).substring(0, 200)}`)
    }

    // Check for maskImageURL (the edited image)
    if (result.maskImageURL) {
      console.log("[v0] Mask image URL found:", result.maskImageURL)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.maskImageURL,
        },
      })
    }

    // Check for imageURL (fallback)
    if (result.imageURL) {
      console.log("[v0] Image URL found:", result.imageURL)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: result.imageURL,
        },
      })
    }

    // If still processing (taskUUID present), poll for result
    if (result.taskUUID) {
      console.log("[v0] Polling for result with taskUUID:", result.taskUUID)
      const editedUrl = await pollForResult(apiKey, result.taskUUID)
      return NextResponse.json({
        success: true,
        editedImage: {
          url: editedUrl,
        },
      })
    }

    throw new Error(`Failed to process image. Response: ${JSON.stringify(result).substring(0, 200)}`)
  } catch (error) {
    console.error("[Inpaint Error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image editing failed" },
      { status: 500 }
    )
  }
}

async function pollForResult(apiKey: string, taskUUID: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(`${RUNWARE_API_ENDPOINT}/getResponse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ taskUUID }),
    })

    if (!response.ok) {
      continue
    }

    const data = await response.json()

    // Handle wrapped response
    let result = null
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      result = data[0]
    }

    if (!result) {
      continue
    }

    // Check for maskImageURL
    if (result.maskImageURL) {
      return result.maskImageURL
    }

    // Check for imageURL
    if (result.imageURL) {
      return result.imageURL
    }

    if (result.status === "failed") {
      throw new Error("Image editing failed")
    }
  }

  throw new Error("Image editing timed out")
}
