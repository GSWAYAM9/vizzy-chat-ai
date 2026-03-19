/**
 * Deep User Profile Service - DASP 1.2
 * Handles all operations on the Deep User Profile
 * Includes creation, updates, refinement, and querying
 */

import { sql } from '@/lib/neon-client'
import type { DeepUserProfile, ProfileUpdateEvent, IdentityLayer } from './types/deep-user-profile'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a new Deep User Profile for a user
 * Called during onboarding
 */
export async function createDeepUserProfile(
  userId: string,
  initialData: Partial<DeepUserProfile>,
  onboardingStatus: 'incomplete' | 'minimum' | 'complete' | 'extended' = 'incomplete'
): Promise<DeepUserProfile> {
  try {
    // Create minimal viable profile
    const defaultProfile: DeepUserProfile = {
      userId: userId as any,
      version: 1,
      schemaVersion: '1.2',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRefinedAt: new Date(),
      
      consentSettings: {
        hasConsented: initialData.consentSettings?.hasConsented || false,
        dataUsageConsent: false,
        thirdPartyIntegrationConsent: false,
        wearableDataConsent: false,
        journalConnectionConsent: false,
        musicConnectionConsent: false,
      },
      
      identity: initialData.identity || {
        name: '',
        livingSituation: 'solo',
        lifeStage: 'professional',
        languagePreferences: ['en'],
        currentLifeChapter: '',
        lifeGoals: [],
        longTermAspirations: [],
      },
      
      aesthetic: initialData.aesthetic || {
        visualStylePreferences: [],
        colourPaletteAffinities: [],
        preferredArtists: [],
        preferredArtMovements: [],
        preferredPhotographyStyles: [],
        typographyPreferences: [],
        musicGenrePreferences: [],
        musicMoods: [],
        interiorAestheticPreferences: [],
        aestheticDislikes: [],
        aestheticEvolutionLog: [],
      },
      
      emotional: initialData.emotional || {
        emotionalPatterns: [],
        emotionalNeeds: [],
        energyLevelByTime: [],
        stressIndicators: [],
        stressPatterns: [],
        groundingVsActivating: { grounding: [], activating: [] },
        emotionalHistoryLog: [],
        sensitivityFlags: [],
      },
      
      intellectual: initialData.intellectual || {
        primaryIntellectualInterests: [],
        secondaryInterests: [],
        hobbies: [],
        currentFocusAreas: [],
        recentlyEngagedContent: [],
        beliefSystems: [],
        worldViews: [],
        inspiringIdeas: [],
      },
      
      behavioral: initialData.behavioral || {
        dailyRhythm: {},
        weeklyPatterns: {},
        seasonalPatterns: [],
        displayRoomContext: 'bedroom',
        deviceUsagePatterns: '',
        contentInteractionHistory: [],
      },
      
      creative: initialData.creative || {
        isCreative: false,
        roleOfArtInLife: 'decorative',
      },
      
      profileCompleteness: initialData.profileCompleteness || 0,
      onboardingStatus,
      isActive: true,
      
      connectedDataSources: {
        spotify: false,
        journal: { platform: '', connected: false },
        calendar: { platform: '', connected: false },
        wearable: { type: '', connected: false },
      },
    }

    // Store in database
    const result = await sql`
      INSERT INTO deep_user_profiles (
        user_id,
        profile_data,
        version,
        schema_version,
        profile_completeness,
        onboarding_status
      )
      VALUES (
        ${userId}::uuid,
        ${JSON.stringify(defaultProfile)}::jsonb,
        1,
        '1.2',
        ${defaultProfile.profileCompleteness},
        ${onboardingStatus}
      )
      RETURNING *
    `

    return defaultProfile
  } catch (error) {
    console.error('[DASP] Error creating Deep User Profile:', error)
    throw error
  }
}

/**
 * Get a user's Deep User Profile
 */
export async function getDeepUserProfile(userId: string): Promise<DeepUserProfile | null> {
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
    console.error('[DASP] Error fetching Deep User Profile:', error)
    throw error
  }
}

/**
 * Update a specific layer of the Deep User Profile
 */
export async function updateProfileLayer(
  userId: string,
  layer: keyof Omit<DeepUserProfile, 'userId' | 'version' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'lastRefinedAt' | 'consentSettings' | 'connectedDataSources' | 'profileCompleteness' | 'onboardingStatus' | 'isActive'>,
  updates: any,
  updateType: 'explicit' | 'implicit' | 'connected_data' | 'ai_synthesis' = 'explicit'
): Promise<DeepUserProfile> {
  try {
    // Get current profile
    const profile = await getDeepUserProfile(userId)
    if (!profile) {
      throw new Error(`Profile not found for user ${userId}`)
    }

    // Create update event
    await recordProfileUpdateEvent(
      userId,
      updateType,
      layer,
      profile[layer],
      updates
    )

    // Update profile
    const updatedProfile = {
      ...profile,
      [layer]: {
        ...profile[layer],
        ...updates,
      },
      version: profile.version + 1,
      updatedAt: new Date(),
      lastRefinedAt: new Date(),
    }

    // Store updated version
    await sql`
      INSERT INTO deep_user_profile_versions (
        deep_user_profile_id,
        version,
        profile_data
      )
      SELECT id, ${profile.version}, profile_data
      FROM deep_user_profiles
      WHERE user_id = ${userId}::uuid
    `

    // Update current profile
    await sql`
      UPDATE deep_user_profiles
      SET 
        profile_data = ${JSON.stringify(updatedProfile)}::jsonb,
        version = version + 1,
        updated_at = NOW(),
        last_refined_at = NOW()
      WHERE user_id = ${userId}::uuid
    `

    return updatedProfile
  } catch (error) {
    console.error(`[DASP] Error updating profile layer ${layer}:`, error)
    throw error
  }
}

/**
 * Record a profile update event (for refinement engine)
 */
export async function recordProfileUpdateEvent(
  userId: string,
  updateType: 'explicit' | 'implicit' | 'connected_data' | 'ai_synthesis',
  field: string,
  oldValue: any,
  newValue: any,
  source: string = 'system',
  confidence: number = 1.0
): Promise<void> {
  try {
    // Get profile ID
    const profileResult = await sql`
      SELECT id FROM deep_user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `

    if (!profileResult || profileResult.length === 0) {
      return
    }

    const profileId = profileResult[0].id

    await sql`
      INSERT INTO profile_update_events (
        deep_user_profile_id,
        user_id,
        update_type,
        field_path,
        old_value,
        new_value,
        source,
        confidence
      )
      VALUES (
        ${profileId}::uuid,
        ${userId}::uuid,
        ${updateType},
        ${field},
        ${JSON.stringify(oldValue)}::jsonb,
        ${JSON.stringify(newValue)}::jsonb,
        ${source},
        ${confidence}
      )
    `
  } catch (error) {
    console.error('[DASP] Error recording profile update event:', error)
  }
}

/**
 * Update consent settings
 */
export async function updateConsentSettings(
  userId: string,
  consents: {
    dataUsageConsent?: boolean
    thirdPartyIntegrationConsent?: boolean
    wearableDataConsent?: boolean
    journalConnectionConsent?: boolean
    musicConnectionConsent?: boolean
  }
): Promise<DeepUserProfile> {
  try {
    const profile = await getDeepUserProfile(userId)
    if (!profile) {
      throw new Error(`Profile not found for user ${userId}`)
    }

    const updatedProfile = {
      ...profile,
      consentSettings: {
        ...profile.consentSettings,
        ...consents,
      },
      updatedAt: new Date(),
    }

    await sql`
      UPDATE deep_user_profiles
      SET 
        profile_data = ${JSON.stringify(updatedProfile)}::jsonb,
        updated_at = NOW(),
        data_usage_consent = ${consents.dataUsageConsent ?? false},
        third_party_integration_consent = ${consents.thirdPartyIntegrationConsent ?? false},
        wearable_data_consent = ${consents.wearableDataConsent ?? false},
        journal_connection_consent = ${consents.journalConnectionConsent ?? false},
        music_connection_consent = ${consents.musicConnectionConsent ?? false}
      WHERE user_id = ${userId}::uuid
    `

    return updatedProfile
  } catch (error) {
    console.error('[DASP] Error updating consent settings:', error)
    throw error
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(
  userId: string,
  status: 'minimum' | 'complete' | 'extended'
): Promise<DeepUserProfile> {
  try {
    const profile = await getDeepUserProfile(userId)
    if (!profile) {
      throw new Error(`Profile not found for user ${userId}`)
    }

    const updatedProfile = {
      ...profile,
      onboardingStatus: status,
      profileCompleteness: Math.min(100, profile.profileCompleteness + 20),
      updatedAt: new Date(),
    }

    await sql`
      UPDATE deep_user_profiles
      SET 
        profile_data = ${JSON.stringify(updatedProfile)}::jsonb,
        onboarding_status = ${status},
        onboarding_completed_at = NOW(),
        updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `

    return updatedProfile
  } catch (error) {
    console.error('[DASP] Error completing onboarding:', error)
    throw error
  }
}

/**
 * Get profile update history
 */
export async function getProfileUpdateHistory(
  userId: string,
  limit: number = 50
): Promise<ProfileUpdateEvent[]> {
  try {
    const result = await sql`
      SELECT 
        user_id,
        timestamp,
        update_type,
        field_path,
        old_value,
        new_value,
        confidence,
        source,
        user_approved
      FROM profile_update_events
      WHERE user_id = ${userId}::uuid
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `

    return result.map(event => ({
      userId: event.user_id,
      timestamp: new Date(event.timestamp),
      updateType: event.update_type,
      field: event.field_path,
      oldValue: event.old_value,
      newValue: event.new_value,
      confidence: parseFloat(event.confidence),
      source: event.source,
      userApproved: event.user_approved,
    }))
  } catch (error) {
    console.error('[DASP] Error fetching profile update history:', error)
    throw error
  }
}

/**
 * Calculate profile completeness score
 */
export async function calculateProfileCompleteness(
  userId: string
): Promise<number> {
  try {
    const profile = await getDeepUserProfile(userId)
    if (!profile) {
      return 0
    }

    let filledFields = 0
    let totalFields = 0

    // Count fields in each layer
    const countFields = (obj: any): { filled: number; total: number } => {
      let filled = 0
      let total = 0

      for (const key in obj) {
        if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
          total++
        } else if (Array.isArray(obj[key])) {
          total++
          if (obj[key].length > 0) {
            filled++
          }
        } else if (typeof obj[key] === 'object') {
          const nested = countFields(obj[key])
          filled += nested.filled
          total += nested.total
        } else {
          total++
          filled++
        }
      }
      return { filled, total }
    }

    const layers = [
      profile.identity,
      profile.aesthetic,
      profile.emotional,
      profile.intellectual,
      profile.behavioral,
      profile.creative,
    ]

    for (const layer of layers) {
      const counts = countFields(layer)
      filledFields += counts.filled
      totalFields += counts.total
    }

    const completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0

    // Update in database
    await sql`
      UPDATE deep_user_profiles
      SET profile_completeness = ${completeness}
      WHERE user_id = ${userId}::uuid
    `

    return completeness
  } catch (error) {
    console.error('[DASP] Error calculating profile completeness:', error)
    return 0
  }
}
