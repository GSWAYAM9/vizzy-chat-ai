import { NextRequest, NextResponse } from 'next/server'

const STABILITY_API_KEY = process.env.STABILITY_API_KEY
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint'

export async function POST(request: NextRequest) {
  try {
    if (!STABILITY_API_KEY) {
      return NextResponse.json(
        { error: 'STABILITY_API_KEY not configured' },
        { status: 500 }
      )
    }

    const { imageUrl, prompt } = await request.json()

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Missing imageUrl or prompt' },
        { status: 400 }
      )
    }

    console.log('[v0] Inpainting with Stability AI:', { prompt })

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from URL')
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    // Create FormData for Stability AI API
    const formData = new FormData()
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png')
    formData.append('prompt', prompt)
    formData.append('output_format', 'png')

    // Call Stability AI inpainting API
    const stabilityResponse = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
      body: formData,
    })

    if (!stabilityResponse.ok) {
      const errorData = await stabilityResponse.text()
      console.error('[v0] Stability AI error:', stabilityResponse.status, errorData)
      throw new Error(`Stability AI API error: ${stabilityResponse.status}`)
    }

    const imageBlob = await stabilityResponse.blob()
    const base64Image = await blobToBase64(imageBlob)

    return NextResponse.json({
      editedImage: {
        url: `data:image/png;base64,${base64Image}`,
      },
    })
  } catch (error) {
    console.error('[v0] Inpaint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to inpaint image' },
      { status: 500 }
    )
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
