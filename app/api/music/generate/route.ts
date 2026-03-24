import { NextRequest, NextResponse } from 'next/server'
import { generateMusicWithPolling } from '@/lib/suno/music-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[MUSIC API] Received music generation request')
    console.log('[MUSIC API] SUNO_API_KEY present:', !!process.env.SUNO_API_KEY)
    console.log('[MUSIC API] SUNO_API_KEY length:', process.env.SUNO_API_KEY?.length || 0)
    
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
    console.log('[MUSIC API] Calling generateMusicWithPolling...')
    const musicRecord = await generateMusicWithPolling('user_default', prompt, {
      title: prompt.substring(0, 100),
      style: 'pop',
    })

    console.log('[MUSIC API] Music generation record created:', JSON.stringify(musicRecord))

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
