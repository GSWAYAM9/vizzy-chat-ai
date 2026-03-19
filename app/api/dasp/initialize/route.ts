import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon-client'
import { createDeepUserProfile, completeOnboarding, getDeepUserProfile } from '@/lib/dasp/services/deep-user-profile-service'
import { SYSTEM_CARD } from '@/lib/dasp/config/system-card'

/**
 * POST /api/dasp/initialize
 * Initialize DASP for a user - called after authentication
 * Creates Deep User Profile and begins onboarding flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, initialData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Initializing system for user: ${userId}`)

    // Check if profile already exists
    const existingProfile = await sql`
      SELECT id FROM deep_user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `

    if (existingProfile && existingProfile.length > 0) {
      console.log(`[DASP] Profile already exists for user ${userId}`)
      return NextResponse.json(
        {
          message: 'DASP already initialized for this user',
          systemCard: SYSTEM_CARD,
        },
        { status: 200 }
      )
    }

    // Create new Deep User Profile
    const profile = await createDeepUserProfile(
      userId,
      initialData || {},
      'incomplete'
    )

    console.log(`[DASP] Profile created for user: ${userId}`)

    return NextResponse.json(
      {
        message: 'DASP initialized successfully',
        profile,
        systemCard: SYSTEM_CARD,
        nextStep: 'onboarding',
        onboardingUrl: '/dasp/onboarding',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[DASP] Error initializing system:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize DASP',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dasp/initialize/system-card
 * Get the System Card (public information about DASP capabilities)
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        systemCard: SYSTEM_CARD,
        version: SYSTEM_CARD.identity.version,
        capabilities: SYSTEM_CARD.capabilities.canDo,
        boundaries: SYSTEM_CARD.capabilities.cannotDo,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DASP] Error fetching system card:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch system card',
      },
      { status: 500 }
    )
  }
}
