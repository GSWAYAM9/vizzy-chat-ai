import { NextRequest, NextResponse } from 'next/server'

/**
 * Music Generation Test Endpoint
 * Returns a simple test response to verify the API works
 * v2.0 - Clean rebuild
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[MUSIC-API] POST request received')
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      console.log('[MUSIC-API] No prompt provided')
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    console.log('[MUSIC-API] Music generation requested:', prompt)
    
    // Return mock data - replace with real Suno API calls when ready
    const response = {
      generationId: 'test_' + Date.now(),
      title: prompt.substring(0, 100),
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      status: 'completed',
      prompt: prompt,
    }
    
    console.log('[MUSIC-API] Returning response:', response)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[MUSIC-API] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate music' },
      { status: 500 }
    )
  }
}
