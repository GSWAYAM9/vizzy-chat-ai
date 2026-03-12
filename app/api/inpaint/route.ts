import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

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

    // Convert image to PNG format (required by Stability AI)
    const pngBuffer = await sharp(imageBuffer)
      .png()
      .toBuffer()

    // Create FormData for Stability AI API
    const formData = new FormData()
    formData.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'image.png')
    formData.append('prompt', prompt)
    formData.append('output_format', 'png')

    // Call Stability AI inpainting API
    const stabilityResponse = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*',
      },
      body: formData,
    })

    if (!stabilityResponse.ok) {
      const errorData = await stabilityResponse.text()
      console.error('[v0] Stability AI error:', stabilityResponse.status, errorData)
      throw new Error(`Stability AI API error: ${stabilityResponse.status}`)
    }

    const imageBuffer = await stabilityResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    console.log('[v0] Image edited successfully')

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
