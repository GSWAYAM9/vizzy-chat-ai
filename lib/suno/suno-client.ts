/**
 * Suno API Client
 * Handles music generation via Suno API
 * Documentation: https://docs.sunoapi.org/suno-api/generate-music
 */

const SUNO_API_BASE = 'https://api.sunoapi.org'
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
  status: 'submitted' | 'processing' | 'completed' | 'error' | 'pending'
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
 * Uses the v1 API endpoint with required parameters
 */
export async function generateSong(request: SunoGenerateRequest): Promise<{ id: string; status: string }> {
  try {
    if (!SUNO_API_KEY) {
      console.error('[SUNO] ERROR: SUNO_API_KEY is not configured in environment variables')
      throw new Error('SUNO_API_KEY is not configured')
    }

    console.log('[SUNO] API Key present (length:', SUNO_API_KEY.length, ')')
    console.log('[SUNO] Generating song with prompt:', request.prompt.substring(0, 50))

    // Use the v1 endpoint with required parameters
    // According to API docs, for non-custom mode: only prompt is required
    const requestBody = {
      customMode: false, // Use non-custom mode (simpler)
      instrumental: false, // Generate with lyrics
      model: 'V4_5ALL', // Latest model
      prompt: request.prompt, // This is the only required field in non-custom mode
      callBackUrl: 'https://api.example.com/callback', // Required by API but we'll poll instead
    }

    console.log('[SUNO] Request body:', JSON.stringify(requestBody).substring(0, 200))

    const response = await fetch(`${SUNO_API_BASE}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[SUNO] API Response Status:', response.status, response.statusText)

    const data = await response.json()
    console.log('[SUNO] API Response:', JSON.stringify(data).substring(0, 300))

    if (!response.ok) {
      const error = data.msg || await response.text()
      console.error('[SUNO] Generation failed:', error)
      throw new Error(`Suno API error: ${response.status} - ${error}`)
    }

    const taskId = data.data?.taskId
    if (!taskId) {
      console.error('[SUNO] No taskId in response:', data)
      throw new Error('No taskId returned from Suno API')
    }

    console.log('[SUNO] Generation task started with ID:', taskId)

    return {
      id: taskId,
      status: 'processing',
    }
  } catch (error) {
    console.error('[SUNO] Error generating song:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

/**
 * Poll for song generation status
 * Uses the /api/v1/generate/record-info endpoint
 */
export async function getSongStatus(songId: string): Promise<SunoClip | null> {
  try {
    if (!SUNO_API_KEY) {
      throw new Error('SUNO_API_KEY is not configured')
    }

    console.log('[SUNO] Checking status for task:', songId)

    const response = await fetch(`${SUNO_API_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(songId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    })

    console.log('[SUNO] Status check response:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn('[SUNO] Status check failed:', response.status, errorData.msg)
      return null
    }

    const apiResponse = await response.json()
    console.log('[SUNO] Status response:', JSON.stringify(apiResponse).substring(0, 300))

    const taskStatus = apiResponse.data?.status
    console.log('[SUNO] Task status:', taskStatus)

    // Map API status to our format
    if (taskStatus === 'SUCCESS' || taskStatus === 'FIRST_SUCCESS') {
      // Extract the first audio clip from the response
      const sunoData = apiResponse.data?.response?.sunoData?.[0]
      if (sunoData) {
        return {
          id: sunoData.id,
          title: sunoData.title,
          prompt: sunoData.prompt,
          gpt_description_prompt: '',
          audio_url: sunoData.audioUrl,
          video_url: '',
          display_name: sunoData.title,
          image_url: sunoData.imageUrl,
          lyric: sunoData.prompt,
          status: 'completed',
          user_id: '',
          is_public: false,
          created_at: sunoData.createTime,
          metadata: {
            duration: sunoData.duration || 0,
            tags: (sunoData.tags || '').split(','),
          },
        }
      }
    }

    if (taskStatus === 'PENDING' || taskStatus === 'TEXT_SUCCESS') {
      return {
        id: songId,
        title: '',
        prompt: '',
        gpt_description_prompt: '',
        audio_url: '',
        video_url: '',
        display_name: '',
        image_url: '',
        lyric: '',
        status: 'processing',
        user_id: '',
        is_public: false,
        created_at: new Date().toISOString(),
        metadata: {
          duration: 0,
          tags: [],
        },
      }
    }

    if (taskStatus === 'CREATE_TASK_FAILED' || taskStatus === 'GENERATE_AUDIO_FAILED' || taskStatus === 'SENSITIVE_WORD_ERROR') {
      const errorMsg = apiResponse.data?.errorMessage || 'Generation failed'
      return {
        id: songId,
        title: '',
        prompt: '',
        gpt_description_prompt: '',
        audio_url: '',
        video_url: '',
        display_name: '',
        image_url: '',
        lyric: '',
        status: 'error',
        error_message: errorMsg,
        user_id: '',
        is_public: false,
        created_at: new Date().toISOString(),
        metadata: {
          duration: 0,
          tags: [],
        },
      }
    }

    return null
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
