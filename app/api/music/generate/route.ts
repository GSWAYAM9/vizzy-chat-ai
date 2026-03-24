import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint - just return a mock music generation response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    console.log('[MUSIC API TEST] Received prompt:', prompt)
    
    // Return a test response with mock data
    return NextResponse.json({
      generationId: 'test_' + Date.now(),
      title: prompt.substring(0, 50),
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      status: 'completed',
      prompt: prompt,
      message: 'Music generation would go here'
    }, { status: 201 })
  } catch (error) {
    console.error('[MUSIC API] Error:', error)
    return NextResponse.json({ error: 'Failed to generate music' }, { status: 500 })
  }
}
