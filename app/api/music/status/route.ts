import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generationId')

    if (!generationId) {
      return NextResponse.json({ error: 'generationId required' }, { status: 400 })
    }

    console.log('[MUSIC STATUS TEST] Checking status for:', generationId)

    // Return test status - always completed
    return NextResponse.json({
      generationId,
      status: 'completed',
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      title: 'Test Music',
      prompt: 'Test prompt'
    }, { status: 200 })
  } catch (error) {
    console.error('[MUSIC STATUS API] Error:', error)
    return NextResponse.json({ error: 'Failed to get music status' }, { status: 500 })
  }
}
