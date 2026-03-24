import { NextRequest, NextResponse } from 'next/server'

/**
 * Music Status Check Endpoint
 * Returns the current status of a music generation task
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generationId')

    console.log('[MUSIC-STATUS] Status check requested for:', generationId)

    if (!generationId) {
      console.log('[MUSIC-STATUS] No generationId provided')
      return NextResponse.json({ error: 'generationId required' }, { status: 400 })
    }

    // Return test status - always completed for testing
    const statusResponse = {
      generationId: generationId,
      status: 'completed',
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      title: 'Generated Music',
      prompt: 'Music generation test'
    }
    
    console.log('[MUSIC-STATUS] Returning status:', statusResponse)
    return NextResponse.json(statusResponse, { status: 200 })
  } catch (error) {
    console.error('[MUSIC-STATUS] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
