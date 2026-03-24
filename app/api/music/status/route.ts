import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generationId')

    if (!generationId) {
      return NextResponse.json({ error: 'generationId required' }, { status: 400 })
    }

    console.log('[MUSIC-STATUS] Checking:', generationId)

    return NextResponse.json({
      generationId: generationId,
      status: 'completed',
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      title: 'Generated Music',
      prompt: 'Music generation test'
    }, { status: 200 })
  } catch (error) {
    console.error('[MUSIC-STATUS] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
