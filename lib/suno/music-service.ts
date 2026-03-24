/**
 * Music Generation Service
 * Orchestrates music creation and tracking
 */

import { sql } from '@/lib/neon-client'
import { generateSong, pollSongUntilComplete } from './suno-client'

export interface MusicGenerationRecord {
  id: string
  userId: string
  prompt: string
  title?: string
  style?: string
  audioUrl?: string
  sunoSongId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  creditsUsed: number
  errorMessage?: string
}

/**
 * Create a music generation record in database
 */
export async function createMusicGeneration(
  userId: string,
  prompt: string,
  sunoSongId: string,
  options?: {
    title?: string
    style?: string
    creditsUsed?: number
  }
): Promise<MusicGenerationRecord> {
  try {
    const result = await sql`
      INSERT INTO music_generations (user_id, prompt, title, style, suno_song_id, status, credits_used)
      VALUES (${userId}, ${prompt}, ${options?.title || ''}, ${options?.style || 'pop'}, ${sunoSongId}, 'processing', ${options?.creditsUsed || 10})
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error('Failed to create music generation record')
    }

    const record = result[0]
    return {
      id: record.id,
      userId: record.user_id,
      prompt: record.prompt,
      title: record.title,
      style: record.style,
      sunoSongId: record.suno_song_id,
      status: record.status,
      createdAt: record.created_at,
      creditsUsed: record.credits_used,
    }
  } catch (error) {
    console.error('[MUSIC] Error creating generation record:', error)
    throw error
  }
}

/**
 * Update music generation status
 */
export async function updateMusicGenerationStatus(
  generationId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  updates?: {
    audioUrl?: string
    title?: string
    errorMessage?: string
  }
): Promise<MusicGenerationRecord | null> {
  try {
    const result = await sql`
      UPDATE music_generations
      SET 
        status = ${status},
        audio_url = ${updates?.audioUrl || null},
        title = ${updates?.title || null},
        error_message = ${updates?.errorMessage || null},
        completed_at = ${status === 'completed' ? new Date().toISOString() : null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${generationId}
      RETURNING *
    `

    if (!result || result.length === 0) {
      return null
    }

    const record = result[0]
    return {
      id: record.id,
      userId: record.user_id,
      prompt: record.prompt,
      title: record.title,
      style: record.style,
      audioUrl: record.audio_url,
      sunoSongId: record.suno_song_id,
      status: record.status,
      createdAt: record.created_at,
      completedAt: record.completed_at,
      creditsUsed: record.credits_used,
      errorMessage: record.error_message,
    }
  } catch (error) {
    console.error('[MUSIC] Error updating generation status:', error)
    throw error
  }
}

/**
 * Get music generation by ID
 */
export async function getMusicGeneration(generationId: string): Promise<MusicGenerationRecord | null> {
  try {
    const result = await sql`
      SELECT * FROM music_generations
      WHERE id = ${generationId}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return null
    }

    const record = result[0]
    return {
      id: record.id,
      userId: record.user_id,
      prompt: record.prompt,
      title: record.title,
      style: record.style,
      audioUrl: record.audio_url,
      sunoSongId: record.suno_song_id,
      status: record.status,
      createdAt: record.created_at,
      completedAt: record.completed_at,
      creditsUsed: record.credits_used,
      errorMessage: record.error_message,
    }
  } catch (error) {
    console.error('[MUSIC] Error getting generation:', error)
    return null
  }
}

/**
 * Get user's music generation history
 */
export async function getUserMusicHistory(userId: string, limit: number = 20): Promise<MusicGenerationRecord[]> {
  try {
    const result = await sql`
      SELECT * FROM music_generations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return result.map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      prompt: record.prompt,
      title: record.title,
      style: record.style,
      audioUrl: record.audio_url,
      sunoSongId: record.suno_song_id,
      status: record.status,
      createdAt: record.created_at,
      completedAt: record.completed_at,
      creditsUsed: record.credits_used,
      errorMessage: record.error_message,
    }))
  } catch (error) {
    console.error('[MUSIC] Error getting music history:', error)
    return []
  }
}

/**
 * Generate music with automatic polling
 */
export async function generateMusicWithPolling(
  userId: string,
  prompt: string,
  options?: {
    title?: string
    style?: string
  }
): Promise<MusicGenerationRecord> {
  try {
    // Step 1: Submit generation request to Suno
    console.log('[MUSIC] Starting generation for:', prompt.substring(0, 50))
    const sunoResponse = await generateSong({
      prompt,
      style: options?.style,
      title: options?.title,
    })

    // Step 2: Create database record
    const musicRecord = await createMusicGeneration(userId, prompt, sunoResponse.id, options)

    // Step 3: Poll for completion (async - don't wait)
    pollAndUpdateMusicGeneration(musicRecord.id).catch((error) => {
      console.error('[MUSIC] Error in background polling:', error)
    })

    return musicRecord
  } catch (error) {
    console.error('[MUSIC] Error generating music:', error)
    throw error
  }
}

/**
 * Background polling function (runs async)
 */
async function pollAndUpdateMusicGeneration(generationId: string) {
  try {
    const record = await getMusicGeneration(generationId)
    if (!record) {
      throw new Error('Music generation not found')
    }

    console.log('[MUSIC] Polling started for:', generationId)

    // Poll until complete (max 60 attempts, 1 second interval)
    const completedClip = await pollSongUntilComplete(record.sunoSongId, 60, 1000)

    if (!completedClip) {
      await updateMusicGenerationStatus(generationId, 'failed', {
        errorMessage: 'Song generation timed out',
      })
      return
    }

    if (completedClip.status === 'error') {
      await updateMusicGenerationStatus(generationId, 'failed', {
        errorMessage: completedClip.error_message || 'Unknown error',
      })
      return
    }

    if (completedClip.status === 'completed') {
      await updateMusicGenerationStatus(generationId, 'completed', {
        audioUrl: completedClip.audio_url,
        title: completedClip.title,
      })
      console.log('[MUSIC] Polling completed:', generationId)
    }
  } catch (error) {
    console.error('[MUSIC] Error in polling:', error)
    await updateMusicGenerationStatus(generationId, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
