import { NextRequest, NextResponse } from 'next/server'

// Bria API inpainting/editing endpoint
const BRIA_INPAINT_ENDPOINT = 'https://engine.prod.bria-api.com/v2/image/inpaint'

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
    const { imageUrl, prompt, negativePrompt } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      )
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'A valid prompt is required' },
        { status: 400 }
      )
    }

    // Prepare the inpainting request
    const briaPayload: Record<string, unknown> = {
      image_url: imageUrl,
      prompt: prompt.trim(),
      sync: true,
      inpaint_type: 'gen_fill', // Use generative fill to enhance the entire image
      steps_num: 30,
      guidance_scale: 5,
    }

    if (negativePrompt) {
      briaPayload.negative_prompt = negativePrompt
    }

    console.log('[v0] Enhancing image with Bria inpaint API')

    const response = await fetch(BRIA_INPAINT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_token: apiKey,
      },
      body: JSON.stringify(briaPayload),
    })

    console.log('[v0] Bria enhancement response status:', response.status)

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

    // Extract the enhanced image URL
    let enhancedImageUrl = ''
    if (data.result?.image_url) {
      enhancedImageUrl = data.result.image_url
    } else if (data.result && Array.isArray(data.result)) {
      enhancedImageUrl = data.result[0]?.image_url || data.result[0]?.urls?.[0] || ''
    }

    if (!enhancedImageUrl) {
      return NextResponse.json(
        { error: 'Failed to extract enhanced image from response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enhancedImage: {
        url: enhancedImageUrl,
        prompt: prompt.trim(),
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
