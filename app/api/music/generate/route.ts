/**
 * Music Generation API Endpoint
 * POST /api/music/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-utils'
import { generateMusicWithPolling } from '@/lib/suno/music-service'
import { trackImageCreation } from '@/lib/subscription/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('[MUSIC API] Generating music for user:', session.user.id)

    // Check subscription and track usage
    try {
      // Music generation uses 1 credit per song (equivalent to 20 images)
      const usageResult = await trackImageCreation(session.user.id, 20)
      
      if (usageResult.status === 'limit_exceeded') {
        return NextResponse.json(
          { error: 'Monthly image limit exceeded. Please purchase credits.' },
          { status: 429 }
        )
      }
    } catch (error) {
      console.warn('[MUSIC API] Could not check subscription:', error)
      // Allow music generation even if subscription check fails
    }

    // Generate music with automatic polling
    const musicRecord = await generateMusicWithPolling(session.user.id, prompt, {
      title: prompt.substring(0, 100),
      style: 'pop', // Default style, could be parameterized
    })

    console.log('[MUSIC API] Music generation started:', musicRecord.id)

    return NextResponse.json(
      {
        generationId: musicRecord.id,
        title: musicRecord.title,
        audioUrl: musicRecord.audioUrl,
        status: musicRecord.status,
        prompt: musicRecord.prompt,
        message: 'Music generation started. Your song will be ready in about 30-60 seconds.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[MUSIC API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate music' },
      { status: 500 }
    )
  }
}
