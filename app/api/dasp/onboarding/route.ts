import { NextRequest, NextResponse } from 'next/server'
import {
  createOnboardingSession,
  getOnboardingSession,
  recordOnboardingResponse,
  completeOnboardingSession,
  skipOnboarding,
  getOnboardingProgressForUser,
} from '@/lib/dasp/services/onboarding-service'
import { ONBOARDING_FLOW } from '@/lib/dasp/types/onboarding'
import type { OnboardingStage } from '@/lib/dasp/types/onboarding'

/**
 * POST /api/dasp/onboarding/start
 * Start a new onboarding session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Starting onboarding session for user: ${userId}`)

    // Create new session
    const session = await createOnboardingSession(userId)

    // Get first step
    const firstStep = ONBOARDING_FLOW[0]

    return NextResponse.json(
      {
        session,
        currentStep: firstStep,
        totalSteps: ONBOARDING_FLOW.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[DASP] Error starting onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to start onboarding' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dasp/onboarding/session
 * Get current onboarding session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get session
    const session = await getOnboardingSession(userId)

    if (!session) {
      return NextResponse.json(
        {
          message: 'No active onboarding session',
          session: null,
        },
        { status: 200 }
      )
    }

    // Get current step
    const currentStep = ONBOARDING_FLOW.find(s => s.stage === session.currentStage)

    // Get progress
    const progress = await getOnboardingProgressForUser(userId)

    return NextResponse.json(
      {
        session,
        currentStep,
        progress,
        totalSteps: ONBOARDING_FLOW.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DASP] Error fetching onboarding session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}
