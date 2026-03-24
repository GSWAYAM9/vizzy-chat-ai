/**
 * Suno API Client
 * Handles music generation via Suno API
 */

const SUNO_API_BASE = 'https://api.suno.ai'
const SUNO_API_KEY = process.env.SUNO_API_KEY

interface SunoGenerateRequest {
  prompt: string
  style?: string
  tags?: string[]
  title?: string
  continue_at?: number
  continue_song_id?: string
}

interface SunoClip {
  id: string
  title: string
  prompt: string
  gpt_description_prompt: string
  audio_url: string
  video_url: string
  display_name: string
  image_url: string
  lyric: string
  status: 'submitted' | 'processing' | 'completed' | 'error'
  error_message?: string
  user_id: string
  is_public: boolean
  created_at: string
  metadata: {
    duration: number
    tags: string[]
    [key: string]: any
  }
}

/**
 * Generate a song using Suno API
 */
export async function generateSong(request: SunoGenerateRequest): Promise<{ id: string; status: string }> {
  try {
    if (!SUNO_API_KEY) {
      throw new Error('SUNO_API_KEY is not configured')
    }

    console.log('[SUNO] Generating song with prompt:', request.prompt.substring(0, 50))

    // Try the standard Suno API endpoint
    let response = await fetch(`${SUNO_API_BASE}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        style: request.style || 'pop',
        tags: request.tags || [],
        title: request.title || '',
        make_instrumental: false,
        continue_at: request.continue_at,
        continue_song_id: request.continue_song_id,
      }),
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      console.error('[SUNO] Generation failed:', error)
      throw new Error(`Suno API error: ${response.status}`)
    }

    // If 404, try the v2 endpoint as fallback
    if (response.status === 404) {
      console.log('[SUNO] Falling back to /api/generate/v2 endpoint')
      response = await fetch(`${SUNO_API_BASE}/api/generate/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUNO_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          style: request.style || 'pop',
          tags: request.tags || [],
          title: request.title || '',
          make_instrumental: false,
          continue_at: request.continue_at,
          continue_song_id: request.continue_song_id,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('[SUNO] V2 Generation failed:', error)
        throw new Error(`Suno API v2 error: ${response.status}`)
      }
    }

    const data = await response.json()
    console.log('[SUNO] Generation started:', data.id || data.clip_id)

    return {
      id: data.id || data.clip_id || 'temp_' + Date.now(),
      status: 'processing',
    }
  } catch (error) {
    console.error('[SUNO] Error generating song:', error)
    throw error
  }
}

/**
 * Poll for song generation status
 */
export async function getSongStatus(songId: string): Promise<SunoClip | null> {
  try {
    if (!SUNO_API_KEY) {
      throw new Error('SUNO_API_KEY is not configured')
    }

    const response = await fetch(`${SUNO_API_BASE}/api/clips/${songId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    })

    if (!response.ok) {
      console.warn('[SUNO] Status check failed:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[SUNO] Status for', songId, ':', data.status)

    return data as SunoClip
  } catch (error) {
    console.error('[SUNO] Error getting song status:', error)
    return null
  }
}

/**
 * Poll with retry logic - waits for song to complete or timeout
 */
export async function pollSongUntilComplete(
  songId: string,
  maxAttempts: number = 60,
  delayMs: number = 1000
): Promise<SunoClip | null> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const clip = await getSongStatus(songId)

    if (clip) {
      if (clip.status === 'completed') {
        console.log('[SUNO] Song completed:', songId)
        return clip
      }

      if (clip.status === 'error') {
        console.error('[SUNO] Song generation failed:', clip.error_message)
        return clip
      }
    }

    attempts++
    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  console.warn('[SUNO] Polling timeout for:', songId)
  return null
}

/**
 * Continue/extend a song
 */
export async function continueSong(
  songId: string,
  continueAtSeconds: number = 30
): Promise<{ id: string; status: string }> {
  try {
    const response = await fetch(`${SUNO_API_BASE}/api/generate/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify({
        continue_song_id: songId,
        continue_at: continueAtSeconds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      status: 'processing',
    }
  } catch (error) {
    console.error('[SUNO] Error continuing song:', error)
    throw error
  }
}
