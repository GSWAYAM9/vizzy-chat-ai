import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { prompt } = body
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }
    
    return NextResponse.json({
      generationId: 'test_' + Date.now(),
      title: prompt.substring(0, 100),
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      status: 'completed',
      prompt: prompt,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate music' }, { status: 500 })
  }
}
