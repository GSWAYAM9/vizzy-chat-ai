import { NextRequest, NextResponse } from 'next/server'

// Bria API v2 upscale endpoint - increase resolution and improve image quality
// This is the correct endpoint for image enhancement/upscaling
const BRIA_UPSCALE_ENDPOINT = 'https://engine.prod.bria-api.com/v2/image/upscale'
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
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Upscaling image with Bria upscale API')
    console.log('[v0] Fetching from:', BRIA_UPSCALE_ENDPOINT)

    // Prepare the upscale request for Bria v2
    // v2 upscale API uses async by default
    const briaPayload: Record<string, unknown> = {
      image: imageUrl, // Can be URL or base64
      sync: false, // v2 defaults to async, but we can request sync if available
    }

    const response = await fetch(BRIA_UPSCALE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_token: apiKey,
      },
      body: JSON.stringify(briaPayload),
    })

    console.log('[v0] Bria upscale response status:', response.status)

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
        { error: `Upscaling failed: ${errorText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('[v0] Bria response received')

    // v2 API returns async by default with a status_url (202 response)
    if (response.status === 202 && data.status_url) {
      console.log('[v0] Async response received, polling for result')
      const upscaledUrl = await pollForResult(apiKey, data.status_url)
      return NextResponse.json({
        success: true,
        enhancedImage: {
          url: upscaledUrl,
          originalUrl: imageUrl,
        },
      })
    }

    // Sync response (status 200) - v2 returns result as an object with image_url
    let upscaledImageUrl = ''
    if (data.result?.image_url) {
      upscaledImageUrl = data.result.image_url
    } else if (data.image_url) {
      // Sometimes v2 returns image_url at root level
      upscaledImageUrl = data.image_url
    }

    if (!upscaledImageUrl) {
      console.error('[v0] Unexpected response format:', data)
      return NextResponse.json(
        { error: 'Failed to extract upscaled image from response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enhancedImage: {
        url: upscaledImageUrl,
        originalUrl: imageUrl,
      },
    })
  } catch (error) {
    console.error('[Upscale API Error]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during upscaling.' },
      { status: 500 }
    )
  }
}

async function pollForResult(apiKey: string, statusUrl: string): Promise<string> {
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
      // v2 returns result.image_url or image_url at root level
      return statusData.result?.image_url || statusData.image_url || ''
    }

    if (statusData.status === 'FAILED') {
      throw new Error(statusData.error?.message || 'Image upscaling failed on Bria side.')
    }

    // Still processing, continue polling
  }

  throw new Error('Image upscaling timed out. Please try again.')
}
