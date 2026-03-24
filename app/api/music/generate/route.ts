import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    console.log('[MUSIC] Generation request:', prompt)
    
    return NextResponse.json({
      generationId: 'test_' + Date.now(),
      title: prompt.substring(0, 100),
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      status: 'completed',
      prompt: prompt,
    }, { status: 201 })
  } catch (error) {
    console.error('[MUSIC] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
