/**
 * Profile Refinement Engine - DASP 1.2
 * Processes signals from user interactions, journal entries, wearables, and AI synthesis
 * Continuously updates the Deep User Profile to reflect user preferences accurately
 */

import { sql } from '@/lib/neon-client'
import type { DeepUserProfile, ProfileUpdateEvent } from '@/lib/dasp/types/deep-user-profile'
import { updateProfileLayer, recordProfileUpdateEvent } from '@/lib/dasp/services/deep-user-profile-service'

/**
 * Signal types that trigger profile refinement
 */
export type SignalSource = 
  | 'explicit_interaction' // User likes, dislikes, dismisses content
  | 'implicit_interaction' // Dwell time, interaction patterns
  | 'journal_entry' // Sentiment, topics, themes from journal
  | 'wearable_data' // Sleep, heart rate, stress levels
  | 'weather' // Current conditions at user location
  | 'calendar_event' // Upcoming events, travel, milestones
  | 'content_engagement' // Pause patterns, skip rates
  | 'conversation_history' // Topics mentioned in chat
  | 'ai_synthesis' // LLM analysis of recent signals

/**
 * Explicit signals from user actions
 */
export interface ExplicitSignal {
  userId: string
  timestamp: Date
  contentId: string
  action: 'like' | 'dislike' | 'dismiss' | 'save' | 'pause' | 'skip'
  contentType: 'visual' | 'video' | 'audio' | 'text' | 'other'
  contentMetadata: {
    style?: string[]
    mood?: string
    theme?: string
    colors?: string[]
    artist?: string
    artist_movement?: string
  }
  userRating?: number // 1-5 for likes/dislikes
  dwellTime?: number // seconds spent viewing
}

/**
 * Implicit signals from user behavior patterns
 */
export interface ImplicitSignal {
  userId: string
  timestamp: Date
  signalType: 'dwell_time' | 'interaction_pattern' | 'topic_mention' | 'routine_pattern'
  data: any
  confidence: number // 0-1, how confident this signal is
  context: string
}

/**
 * Connected data signal (journal, wearable, weather, etc)
 */
export interface ConnectedDataSignal {
  userId: string
  timestamp: Date
  source: 'journal' | 'wearable' | 'weather' | 'calendar' | 'spotify'
  dataType: string
  rawData: any
  extractedInsights: {
    emotionalState?: string
    themes?: string[]
    sentiment?: number // -1 to 1
    energyLevel?: number // 1-10
    topics?: string[]
  }
}

/**
 * Process an explicit signal from user interaction
 */
export async function processExplicitSignal(signal: ExplicitSignal): Promise<void> {
  try {
    console.log(`[DASP] Processing explicit signal: ${signal.action} on ${signal.contentType}`)

    const profile = await getProfileForRefinement(signal.userId)
    if (!profile) {
      console.warn(`[DASP] Profile not found for user ${signal.userId}`)
      return
    }

    // Extract signals based on action and content
    const updates: Record<string, any> = {}

    // Update aesthetic preferences based on content metadata
    if (signal.action === 'like' || signal.action === 'save') {
      if (signal.contentMetadata.style) {
        updates.visualStylePreferences = [
          ...new Set([
            ...(profile.aesthetic.visualStylePreferences || []),
            ...signal.contentMetadata.style,
          ]),
        ]
      }
      if (signal.contentMetadata.colors) {
        updates.colourPaletteAffinities = [
          ...new Set([
            ...(profile.aesthetic.colourPaletteAffinities || []),
            ...signal.contentMetadata.colors,
          ]),
        ]
      }
      if (signal.contentMetadata.artist) {
        updates.preferredArtists = [
          ...new Set([
            ...(profile.aesthetic.preferredArtists || []),
            signal.contentMetadata.artist,
          ]),
        ]
      }
    }

    // Record dwell time as behavioral signal
    if (signal.dwellTime && signal.dwellTime > 30) {
      // User spent more than 30 seconds - likely interested
      const userApproved =
        signal.action === 'like' || signal.action === 'save'
    }

    // Update profile with high confidence
    if (Object.keys(updates).length > 0) {
      await updateProfileLayer(signal.userId, 'aesthetic', updates, 'implicit')

      // Log the update event
      await recordProfileUpdateEvent(
        signal.userId,
        'implicit',
        `aesthetic.${Object.keys(updates)[0]}`,
        null,
        updates[Object.keys(updates)[0]],
        `explicit_${signal.action}`,
        0.9 // High confidence
      )
    }

    // Store signal in database for trend analysis
    await storeSignal(signal)
  } catch (error) {
    console.error('[DASP] Error processing explicit signal:', error)
  }
}

/**
 * Process implicit signals from user interaction patterns
 */
export async function processImplicitSignal(signal: ImplicitSignal): Promise<void> {
  try {
    console.log(`[DASP] Processing implicit signal: ${signal.signalType}`)

    const profile = await getProfileForRefinement(signal.userId)
    if (!profile) {
      console.warn(`[DASP] Profile not found for user ${signal.userId}`)
      return
    }

    const updates: Record<string, any> = {}

    // Process based on signal type
    switch (signal.signalType) {
      case 'dwell_time':
        // Analyze what content user spends time on
        if (signal.data.contentStyle && signal.data.dwellSeconds > 30) {
          if (!updates.visualStylePreferences) {
            updates.visualStylePreferences = profile.aesthetic.visualStylePreferences || []
          }
          updates.visualStylePreferences.push(signal.data.contentStyle)
        }
        break

      case 'interaction_pattern':
        // Update behavioral patterns
        if (signal.data.timeOfDay && signal.data.frequencyPerDay) {
          if (!updates.dailyRhythm) {
            updates.dailyRhythm = profile.behavioral.dailyRhythm || {}
          }
          // Track when user is most active
        }
        break

      case 'topic_mention':
        // Extract intellectual interests from conversation
        if (signal.data.topics) {
          if (!updates.currentFocusAreas) {
            updates.currentFocusAreas = profile.intellectual.currentFocusAreas || []
          }
          updates.currentFocusAreas = [
            ...new Set([...updates.currentFocusAreas, ...signal.data.topics]),
          ]
        }
        break

      case 'routine_pattern':
        // Update behavioral patterns
        if (signal.data.routineType && signal.data.frequency) {
          if (!updates.weeklyPatterns) {
            updates.weeklyPatterns = profile.behavioral.weeklyPatterns || {}
          }
          updates.weeklyPatterns[signal.data.routineType] = signal.data.frequency
        }
        break
    }

    // Update profile with confidence score from signal
    if (Object.keys(updates).length > 0) {
      const layer = determineLayerFromUpdates(updates)
      await updateProfileLayer(signal.userId, layer, updates, 'implicit')

      await recordProfileUpdateEvent(
        signal.userId,
        'implicit',
        `${layer}.${Object.keys(updates)[0]}`,
        null,
        updates[Object.keys(updates)[0]],
        `implicit_${signal.signalType}`,
        signal.confidence
      )
    }

    // Store signal for trend analysis
    await storeSignal(signal)
  } catch (error) {
    console.error('[DASP] Error processing implicit signal:', error)
  }
}

/**
 * Process connected data signals (journal, wearable, weather, etc)
 */
export async function processConnectedDataSignal(signal: ConnectedDataSignal): Promise<void> {
  try {
    console.log(`[DASP] Processing connected data signal from: ${signal.source}`)

    const profile = await getProfileForRefinement(signal.userId)
    if (!profile) {
      console.warn(`[DASP] Profile not found for user ${signal.userId}`)
      return
    }

    const updates: Record<string, any> = {}

    // Process based on source
    switch (signal.source) {
      case 'journal':
        // Extract emotional and intellectual insights from journal entries
        if (signal.extractedInsights.emotionalState) {
          // Record emotional state
          await sql`
            INSERT INTO emotional_history_logs (
              deep_user_profile_id,
              emotional_state,
              intensity,
              trigger,
              recorded_source,
              metadata
            )
            SELECT
              id,
              ${signal.extractedInsights.emotionalState},
              ${signal.extractedInsights.sentiment ? Math.round((signal.extractedInsights.sentiment + 1) * 5) : 5},
              ${signal.extractedInsights.themes?.[0] || null},
              'journal_entry',
              ${JSON.stringify(signal.rawData)}::jsonb
            FROM deep_user_profiles
            WHERE user_id = ${signal.userId}::uuid
          `
        }

        if (signal.extractedInsights.themes) {
          updates.currentFocusAreas = [
            ...new Set([
              ...(profile.intellectual.currentFocusAreas || []),
              ...signal.extractedInsights.themes,
            ]),
          ]
        }
        break

      case 'wearable':
        // Extract health and energy patterns
        if (signal.extractedInsights.energyLevel) {
          if (!updates.energyLevelByTime) {
            updates.energyLevelByTime = profile.behavioral.energyLevelByTime || []
          }
          // Track energy levels by time of day
        }
        if (signal.extractedInsights.emotionalState) {
          // Stress levels, sleep quality affect emotional profile
          if (!updates.emotionalPatterns) {
            updates.emotionalPatterns = profile.emotional.emotionalPatterns || []
          }
        }
        break

      case 'weather':
        // Weather affects mood and inspiration
        if (signal.data.condition) {
          // Log environmental context for mood analysis
        }
        break

      case 'calendar':
        // Extract life events and their significance
        if (signal.extractedInsights.themes) {
          // Update behavioral patterns based on upcoming events
        }
        break

      case 'spotify':
        // Extract music preferences and moods
        if (signal.extractedInsights.themes) {
          updates.musicGenrePreferences = [
            ...new Set([
              ...(profile.aesthetic.musicGenrePreferences || []),
              ...signal.extractedInsights.themes,
            ]),
          ]
        }
        break
    }

    // Update profile
    if (Object.keys(updates).length > 0) {
      const layer = determineLayerFromUpdates(updates)
      await updateProfileLayer(signal.userId, layer, updates, 'connected_data')

      await recordProfileUpdateEvent(
        signal.userId,
        'connected_data',
        `${layer}.${Object.keys(updates)[0]}`,
        null,
        updates[Object.keys(updates)[0]],
        `connected_data_${signal.source}`,
        0.7 // Medium confidence
      )
    }

    // Store signal
    await storeSignal(signal)
  } catch (error) {
    console.error('[DASP] Error processing connected data signal:', error)
  }
}

/**
 * Run AI synthesis on recent signals (periodic task)
 * Synthesizes patterns and suggests profile updates
 */
export async function runAISynthesis(userId: string, timeWindowDays: number = 7): Promise<void> {
  try {
    console.log(`[DASP] Running AI synthesis for user ${userId}`)

    const profile = await getProfileForRefinement(userId)
    if (!profile) {
      console.warn(`[DASP] Profile not found for user ${userId}`)
      return
    }

    // Fetch recent signals
    const recentSignals = await sql`
      SELECT signal_data
      FROM user_signals
      WHERE user_id = ${userId}::uuid
      AND created_at > NOW() - INTERVAL '${timeWindowDays} days'
      ORDER BY created_at DESC
    `

    if (!recentSignals || recentSignals.length === 0) {
      console.log(`[DASP] No recent signals for user ${userId}`)
      return
    }

    // Analyze patterns (in real implementation, would call LLM)
    const insights = analyzeSignalPatterns(recentSignals.map(s => s.signal_data))

    // Generate suggestions
    const suggestions = generateProfileSuggestions(profile, insights)

    // Store suggestions for user review
    await storeSynthesisSuggestions(userId, suggestions)

    console.log(`[DASP] AI synthesis completed, ${suggestions.length} suggestions generated`)
  } catch (error) {
    console.error('[DASP] Error running AI synthesis:', error)
  }
}

/**
 * Get profile for refinement (with all data loaded)
 */
async function getProfileForRefinement(userId: string): Promise<DeepUserProfile | null> {
  try {
    const result = await sql`
      SELECT profile_data
      FROM deep_user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return null
    }

    return result[0].profile_data as DeepUserProfile
  } catch (error) {
    console.error('[DASP] Error fetching profile for refinement:', error)
    return null
  }
}

/**
 * Determine which profile layer a set of updates belongs to
 */
function determineLayerFromUpdates(updates: Record<string, any>):
  | 'aesthetic'
  | 'emotional'
  | 'intellectual'
  | 'behavioral'
  | 'creative' {
  const key = Object.keys(updates)[0]

  const layerMap: Record<string, any> = {
    visualStyle: 'aesthetic',
    colourPalette: 'aesthetic',
    preferredArtists: 'aesthetic',
    music: 'aesthetic',
    emotionalState: 'emotional',
    emotionalNeeds: 'emotional',
    energyLevel: 'behavioral',
    dailyRhythm: 'behavioral',
    weeklyPatterns: 'behavioral',
    currentFocusAreas: 'intellectual',
    interests: 'intellectual',
    isCreative: 'creative',
  }

  for (const [pattern, layer] of Object.entries(layerMap)) {
    if (key.toLowerCase().includes(pattern.toLowerCase())) {
      return layer
    }
  }

  return 'behavioral' // default
}

/**
 * Store signal in database for trend analysis
 */
async function storeSignal(signal: any): Promise<void> {
  try {
    await sql`
      INSERT INTO user_signals (
        user_id,
        signal_type,
        signal_data,
        source,
        created_at
      )
      VALUES (
        ${signal.userId}::uuid,
        ${signal.signalType || signal.action || signal.source},
        ${JSON.stringify(signal)}::jsonb,
        ${signal.source || 'interaction'},
        NOW()
      )
    `
  } catch (error) {
    console.error('[DASP] Error storing signal:', error)
  }
}

/**
 * Analyze patterns from recent signals
 */
function analyzeSignalPatterns(signals: any[]): any[] {
  // Aggregate signals to identify trends
  const patterns: any[] = []

  // Count style preferences
  const styleCount: Record<string, number> = {}
  signals.forEach(signal => {
    if (signal.contentMetadata?.style) {
      signal.contentMetadata.style.forEach((style: string) => {
        styleCount[style] = (styleCount[style] || 0) + 1
      })
    }
  })

  // Identify top styles
  const topStyles = Object.entries(styleCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([style]) => style)

  if (topStyles.length > 0) {
    patterns.push({
      type: 'style_preference',
      insights: topStyles,
      trend: 'increasing',
    })
  }

  return patterns
}

/**
 * Generate profile suggestions from insights
 */
function generateProfileSuggestions(profile: DeepUserProfile, insights: any[]): any[] {
  const suggestions: any[] = []

  insights.forEach(insight => {
    if (insight.type === 'style_preference') {
      suggestions.push({
        field: 'aesthetic.visualStylePreferences',
        suggestion: `You seem drawn to ${insight.insights.join(', ')} styles lately`,
        confidence: 0.8,
        action: 'review',
      })
    }
  })

  return suggestions
}

/**
 * Store synthesis suggestions for user review
 */
async function storeSynthesisSuggestions(userId: string, suggestions: any[]): Promise<void> {
  try {
    const profileResult = await sql`
      SELECT id FROM deep_user_profiles
      WHERE user_id = ${userId}::uuid
    `

    if (!profileResult || profileResult.length === 0) {
      return
    }

    const profileId = profileResult[0].id

    await sql`
      INSERT INTO profile_refinement_tasks (
        deep_user_profile_id,
        task_type,
        status,
        trigger_source,
        output_data,
        suggestions
      )
      VALUES (
        ${profileId}::uuid,
        'ai_synthesis',
        'completed',
        'scheduled',
        '{}',
        ${JSON.stringify(suggestions)}::jsonb[]
      )
    `
  } catch (error) {
    console.error('[DASP] Error storing synthesis suggestions:', error)
  }
}
