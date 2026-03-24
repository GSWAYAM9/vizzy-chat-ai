/**
 * Music Generation API Endpoint
 * POST /api/music/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateMusicWithPolling } from '@/lib/suno/music-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      console.log('[MUSIC API] No prompt provided')
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('[MUSIC API] Generating music with prompt:', prompt.substring(0, 50))

    // Generate music with automatic polling
    const musicRecord = await generateMusicWithPolling('user_default', prompt, {
      title: prompt.substring(0, 100),
      style: 'pop',
    })

    console.log('[MUSIC API] Music generation record created:', musicRecord)

    return NextResponse.json(
      {
        generationId: musicRecord.id || musicRecord.sunoSongId,
        title: musicRecord.title,
        audioUrl: musicRecord.audioUrl || null,
        status: musicRecord.status,
        prompt: musicRecord.prompt,
        message: 'Music generation started. Your song will be ready in about 30-60 seconds.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[MUSIC API] Error:', error)
    console.error('[MUSIC API] Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate music' },
      { status: 500 }
    )
  }
}
