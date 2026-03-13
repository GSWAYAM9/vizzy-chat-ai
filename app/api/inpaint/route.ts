import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const STABILITY_API_KEY = process.env.STABILITY_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!STABILITY_API_KEY) {
      return NextResponse.json({ error: 'STABILITY_API_KEY not configured' }, { status: 500 })
    }

    const { imageUrl, prompt } = await request.json()

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'Missing imageUrl or prompt' }, { status: 400 })
    }

    console.log('[v0] Fetching image from URL:', imageUrl)

    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('Failed to fetch image')
    const imageBuffer = await imageResponse.arrayBuffer()

    console.log('[v0] Converting image to PNG')

    // Convert to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(imageBuffer)).png().toBuffer()

    console.log('[v0] Sending to Stability AI with prompt:', prompt)

    // Create form data
    const formData = new FormData()
    formData.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'image.png')
    formData.append('prompt', prompt)
    formData.append('output_format', 'png')

    // Call Stability AI
    const response = await fetch('https://api.stability.ai/v2beta/stable-image/edit/inpaint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/png',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] Stability API error:', response.status, error)
      throw new Error(`Stability API error: ${response.status}`)
    }

    console.log('[v0] Image inpainted successfully')

    // Convert response to base64
    const resultBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(resultBuffer).toString('base64')

    return NextResponse.json({
      editedImage: { url: `data:image/png;base64,${base64}` },
    })
  } catch (error) {
    console.error('[v0] Inpaint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Inpaint failed' },
      { status: 500 }
    )
  }
}
