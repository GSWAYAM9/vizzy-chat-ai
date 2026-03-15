import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Fetching images from backend with token:', token.slice(0, 10) + '...')

    const response = await fetch(`${BACKEND_URL}/api/gallery/images/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('[v0] Backend response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] Backend error:', error)
      return NextResponse.json({ error: error || 'Failed to fetch images' }, { status: response.status })
    }

    const data = await response.json()
    console.log('[v0] Returning', Array.isArray(data) ? data.length : data.length || 'unknown', 'images')
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching gallery images:', error)
    return NextResponse.json({ error: 'Internal server error: ' + String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // If no backend URL configured, just return success without saving
    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
      console.log('[v0] No backend configured, skipping gallery save')
      return NextResponse.json({ message: 'Image generated successfully (gallery unavailable)' }, { status: 201 })
    }

    console.log('[v0] Saving image to backend:', body.prompt?.slice(0, 50) + '...')

    try {
      const response = await fetch(`${BACKEND_URL}/api/gallery/images/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      console.log('[v0] Backend save response status:', response.status)

      if (!response.ok) {
        const error = await response.text()
        console.warn('[v0] Backend warning:', error)
        // Don't fail, just warn
        return NextResponse.json({ message: 'Image generated (gallery save failed)', success: true }, { status: 201 })
      }

      const data = await response.json()
      return NextResponse.json(data, { status: 201 })
    } catch (backendError) {
      console.warn('[v0] Backend unavailable, image generation succeeded anyway')
      // If backend is unreachable, still return success for image generation
      return NextResponse.json({ message: 'Image generated successfully (gallery unavailable)' }, { status: 201 })
    }
  } catch (error) {
    console.error('[v0] Error in gallery POST:', error)
    // Even if there's an error, don't block image generation
    return NextResponse.json({ message: 'Image generated (gallery unavailable)' }, { status: 201 })
  }
}
