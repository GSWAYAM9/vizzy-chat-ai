/**
 * Onboarding Service - DASP 1.2
 * Manages the conversational onboarding experience
 * Handles session tracking, response collection, and profile initialization
 */

import { sql } from '@/lib/neon-client'
import type { OnboardingSession, OnboardingStage } from '../types/onboarding'
import { ONBOARDING_FLOW, isMinimumViableProfileComplete } from '../types/onboarding'
import { updateProfileLayer, completeOnboarding } from '@/lib/dasp/services/deep-user-profile-service'

/**
 * Create a new onboarding session
 */
export async function createOnboardingSession(userId: string): Promise<OnboardingSession> {
  try {
    const sessionId = `onboard_${userId}_${Date.now()}`

    const session: OnboardingSession = {
      userId,
      sessionId,
      startedAt: new Date(),
      currentStage: 'welcome',
      stagesCompleted: [],
      responses: [],
      profileCompleteness: 0,
      isMinimumViable: false,
    }

    // Store session in database
    await sql`
      INSERT INTO onboarding_sessions (
        session_id,
        user_id,
        current_stage,
        responses,
        started_at,
        is_complete
      )
      VALUES (
        ${sessionId},
        ${userId}::uuid,
        'welcome',
        '[]'::jsonb,
        NOW(),
        false
      )
    `

    return session
  } catch (error) {
    console.error('[DASP] Error creating onboarding session:', error)
    throw error
  }
}

/**
 * Get active onboarding session
 */
export async function getOnboardingSession(userId: string): Promise<OnboardingSession | null> {
  try {
    const result = await sql`
      SELECT *
      FROM onboarding_sessions
      WHERE user_id = ${userId}::uuid
      AND is_complete = false
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      userId: row.user_id,
      sessionId: row.session_id,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      currentStage: row.current_stage,
      stagesCompleted: row.stages_completed || [],
      responses: row.responses || [],
      profileCompleteness: row.profile_completeness || 0,
      isMinimumViable: row.is_minimum_viable || false,
    }
  } catch (error) {
    console.error('[DASP] Error fetching onboarding session:', error)
    throw error
  }
}

/**
 * Record a response to an onboarding question
 */
export async function recordOnboardingResponse(
  userId: string,
  stage: OnboardingStage,
  answer: any
): Promise<OnboardingSession> {
  try {
    const session = await getOnboardingSession(userId)
    if (!session) {
      throw new Error(`No active onboarding session for user ${userId}`)
    }

    // Find the step configuration
    const step = ONBOARDING_FLOW.find(s => s.stage === stage)
    if (!step) {
      throw new Error(`Invalid onboarding stage: ${stage}`)
    }

    // Add response to session
    session.responses.push({
      stage,
      answer,
      timestamp: new Date(),
    })

    // Mark stage as completed
    if (!session.stagesCompleted.includes(stage)) {
      session.stagesCompleted.push(stage)
    }

    // Calculate progress
    const progress = getOnboardingProgress(session.stagesCompleted)
    session.profileCompleteness = progress.percentage

    // Check if minimum viable profile is complete
    session.isMinimumViable = isMinimumViableProfileComplete(session.stagesCompleted)

    // Update session in database
    await sql`
      UPDATE onboarding_sessions
      SET
        responses = ${JSON.stringify(session.responses)}::jsonb,
        stages_completed = ${JSON.stringify(session.stagesCompleted)}::text[],
        current_stage = ${stage},
        profile_completeness = ${session.profileCompleteness},
        is_minimum_viable = ${session.isMinimumViable},
        updated_at = NOW()
      WHERE session_id = ${session.sessionId}
    `

    // Apply response to Deep User Profile
    await applyOnboardingResponseToProfile(userId, step, answer)

    return session
  } catch (error) {
    console.error('[DASP] Error recording onboarding response:', error)
    throw error
  }
}

/**
 * Apply onboarding response to Deep User Profile
 */
async function applyOnboardingResponseToProfile(
  userId: string,
  step: (typeof ONBOARDING_FLOW)[0],
  answer: any
): Promise<void> {
  try {
    const fieldMap = step.fieldMap
    const [layer, field] = fieldMap.split('.')

    // Map stage to profile layer
    const layerMap: Record<string, keyof any> = {
      identity: 'identity',
      aesthetic: 'aesthetic',
      emotional: 'emotional',
      intellectual: 'intellectual',
      behavioral: 'behavioral',
      creative: 'creative',
      consentSettings: 'consentSettings',
    }

    const profileLayer = layerMap[layer]
    if (!profileLayer) {
      console.warn(`[DASP] Unknown profile layer: ${layer}`)
      return
    }

    // Update the appropriate profile layer
    if (profileLayer === 'consentSettings') {
      // Handle consent separately
      await updateConsentSettings(userId, { dataUsageConsent: answer })
    } else {
      await updateProfileLayer(
        userId,
        profileLayer,
        { [field]: answer },
        'explicit'
      )
    }
  } catch (error) {
    console.error('[DASP] Error applying onboarding response to profile:', error)
    // Don't throw - continue with onboarding even if profile update fails
  }
}

/**
 * Complete onboarding session
 */
export async function completeOnboardingSession(
  userId: string,
  skipToComplete: boolean = false
): Promise<void> {
  try {
    const session = await getOnboardingSession(userId)
    if (!session) {
      throw new Error(`No active onboarding session for user ${userId}`)
    }

    // Determine completion status
    let completionStatus: 'minimum' | 'complete' | 'extended' = 'minimum'
    
    if (skipToComplete) {
      completionStatus = 'minimum'
    } else if (session.stagesCompleted.length > 10) {
      completionStatus = 'complete'
    } else if (session.stagesCompleted.length > 7) {
      completionStatus = 'minimum'
    }

    // Mark profile as complete in Deep User Profile
    await completeOnboarding(userId, completionStatus)

    // Mark session as complete in database
    await sql`
      UPDATE onboarding_sessions
      SET
        is_complete = true,
        completed_at = NOW(),
        completion_status = ${completionStatus}
      WHERE session_id = ${session.sessionId}
    `

    console.log(`[DASP] Onboarding completed for user ${userId} with status: ${completionStatus}`)
  } catch (error) {
    console.error('[DASP] Error completing onboarding:', error)
    throw error
  }
}

/**
 * Skip onboarding (go to minimum viable profile)
 */
export async function skipOnboarding(userId: string): Promise<void> {
  try {
    // Complete with minimum viable status
    await completeOnboardingSession(userId, true)
  } catch (error) {
    console.error('[DASP] Error skipping onboarding:', error)
    throw error
  }
}

/**
 * Get onboarding progress for a user (database query version)
 */
export async function getOnboardingProgressForUser(userId: string): Promise<{
  currentStage: OnboardingStage | null
  completedStages: OnboardingStage[]
  completionPercentage: number
  isMinimumViable: boolean
  estimatedTimeRemaining: number // in seconds
}> {
  try {
    const session = await getOnboardingSession(userId)
    if (!session) {
      return {
        currentStage: null,
        completedStages: [],
        completionPercentage: 0,
        isMinimumViable: false,
        estimatedTimeRemaining: 600,
      }
    }

    // Calculate estimated time remaining
    const completedSteps = ONBOARDING_FLOW.filter(step =>
      session.stagesCompleted.includes(step.stage)
    )
    const remainingSteps = ONBOARDING_FLOW.filter(
      step => !session.stagesCompleted.includes(step.stage)
    )
    const estimatedTimeRemaining = remainingSteps.reduce(
      (total, step) => total + step.estimatedDuration,
      0
    )

    return {
      currentStage: session.currentStage,
      completedStages: session.stagesCompleted,
      completionPercentage: session.profileCompleteness,
      isMinimumViable: session.isMinimumViable,
      estimatedTimeRemaining,
    }
  } catch (error) {
    console.error('[DASP] Error getting onboarding progress:', error)
    throw error
  }
}

// Helper function to update consent settings (imported from profile service)
async function updateConsentSettings(
  userId: string,
  consents: {
    dataUsageConsent?: boolean
    thirdPartyIntegrationConsent?: boolean
    wearableDataConsent?: boolean
    journalConnectionConsent?: boolean
    musicConnectionConsent?: boolean
  }
): Promise<any> {
  try {
    const result = await sql`
      SELECT id FROM deep_user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `

    if (!result || result.length === 0) {
      throw new Error(`Profile not found for user ${userId}`)
    }

    const profileId = result[0].id

    await sql`
      UPDATE deep_user_profiles
      SET 
        data_usage_consent = ${consents.dataUsageConsent ?? false},
        third_party_integration_consent = ${consents.thirdPartyIntegrationConsent ?? false},
        wearable_data_consent = ${consents.wearableDataConsent ?? false},
        journal_connection_consent = ${consents.journalConnectionConsent ?? false},
        music_connection_consent = ${consents.musicConnectionConsent ?? false},
        updated_at = NOW()
      WHERE id = ${profileId}::uuid
    `
  } catch (error) {
    console.error('[DASP] Error updating consent settings:', error)
    throw error
  }
}
