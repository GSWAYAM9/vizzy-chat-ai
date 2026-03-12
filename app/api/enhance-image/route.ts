import { NextRequest, NextResponse } from 'next/server'

// Bria API v2 generation endpoint - reuse for image enhancement
// We'll regenerate based on the user's enhancement prompt
const BRIA_GENERATE_ENDPOINT = 'https://engine.prod.bria-api.com/v2/image/generate'
const MAX_POLL_ATTEMPTS = 60
const POLL_INTERVAL_MS = 2000

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BRIA_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BRIA_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    let { imageUrl, prompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      )
    }

    // Enhance the prompt to focus on improving image quality
    const enhancedPrompt = `${prompt.trim()}, high quality, sharp, detailed, professional`

    console.log('[v0] Enhancing image using Bria v2 generate')
    console.log('[v0] Fetching from:', BRIA_GENERATE_ENDPOINT)
    console.log('[v0] Prompt:', enhancedPrompt)

    const briaPayload: Record<string, unknown> = {
      prompt: enhancedPrompt,
      sync: true,
      aspect_ratio: '1:1',
      steps_num: 30,
      guidance_scale: 7.5,
    }

    const response = await fetch(BRIA_GENERATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_token: apiKey,
      },
      body: JSON.stringify(briaPayload),
    })

    console.log('[v0] Bria response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Bria API Error:', response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait and try again.' },
          { status: 429 }
        )
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your BRIA_API_KEY.' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: `Enhancement failed: ${errorText}` },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Extract image URL from response
    let enhancedImageUrl = ''
    
    if (data.result?.image_url) {
      enhancedImageUrl = data.result.image_url
    } else if (data.result && Array.isArray(data.result)) {
      enhancedImageUrl = data.result[0]?.image_url || data.result[0]?.urls?.[0] || ''
    }

    // If async response, poll for result
    if (!enhancedImageUrl && data.request_id && data.status_url) {
      console.log('[v0] Async response received, polling for result')
      const result = await pollForResult(apiKey, data.status_url)
      enhancedImageUrl = result.url
    }

    if (!enhancedImageUrl) {
      console.error('[v0] Unexpected response format:', data)
      return NextResponse.json(
        { error: 'Failed to extract enhanced image from response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enhancedImage: {
        url: enhancedImageUrl,
        originalUrl: imageUrl,
      },
    })
  } catch (error) {
    console.error('[Enhancement API Error]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during enhancement.' },
      { status: 500 }
    )
  }
}

async function pollForResult(
  apiKey: string,
  statusUrl: string
): Promise<{ url: string }> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const statusResponse = await fetch(statusUrl, {
      headers: {
        api_token: apiKey,
      },
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error('[Bria Status Error]', statusResponse.status, errorText)
      continue
    }

    const statusData = await statusResponse.json()

    if (statusData.status === 'COMPLETED') {
      return {
        url: statusData.result?.image_url || '',
      }
    }

    if (statusData.status === 'FAILED') {
      throw new Error(statusData.error?.message || 'Image enhancement failed on Bria side.')
    }

    // Still processing, continue polling
  }

  throw new Error('Image enhancement timed out. Please try again.')
}
