/**
 * Music Status API Endpoint
 * GET /api/music/status?generationId=<id>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSongStatus } from '@/lib/suno/suno-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generationId')

    if (!generationId) {
      return NextResponse.json(
        { error: 'generationId query parameter is required' },
        { status: 400 }
      )
    }

    console.log('[MUSIC STATUS API] Checking status for generation:', generationId)

    const status = await getSongStatus(generationId)

    if (!status) {
      return NextResponse.json(
        { error: 'Generation not found or still processing' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        generationId,
        status: status.status,
        audioUrl: status.audio_url,
        title: status.title,
        prompt: status.prompt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[MUSIC STATUS API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get music status' },
      { status: 500 }
    )
  }
}
