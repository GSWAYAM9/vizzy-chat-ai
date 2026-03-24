/**
 * Music Status API Endpoint
 * GET /api/music/status/:generationId
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-utils'
import { getMusicGeneration } from '@/lib/suno/music-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { generationId: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const generationId = params.generationId

    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      )
    }

    console.log('[MUSIC STATUS] Checking status for:', generationId)

    const musicRecord = await getMusicGeneration(generationId)

    if (!musicRecord) {
      return NextResponse.json(
        { error: 'Music generation not found' },
        { status: 404 }
      )
    }

    // Verify the music belongs to the current user
    if (musicRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        id: musicRecord.id,
        status: musicRecord.status,
        title: musicRecord.title,
        audioUrl: musicRecord.audioUrl,
        prompt: musicRecord.prompt,
        style: musicRecord.style,
        completedAt: musicRecord.completedAt,
        errorMessage: musicRecord.errorMessage,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[MUSIC STATUS] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get music status' },
      { status: 500 }
    )
  }
}
