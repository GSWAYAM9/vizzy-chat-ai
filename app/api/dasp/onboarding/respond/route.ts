import { NextRequest, NextResponse } from 'next/server'
import {
  recordOnboardingResponse,
  completeOnboardingSession,
  skipOnboarding,
} from '@/lib/dasp/services/onboarding-service'
import { ONBOARDING_FLOW, getNextStage } from '@/lib/dasp/types/onboarding'
import type { OnboardingStage } from '@/lib/dasp/types/onboarding'

/**
 * POST /api/dasp/onboarding/respond
 * Record a response to an onboarding question
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stage, answer } = body

    if (!userId || !stage || answer === undefined) {
      return NextResponse.json(
        { error: 'userId, stage, and answer are required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Recording onboarding response - Stage: ${stage}`)

    // Validate stage
    const validStage = ONBOARDING_FLOW.find(s => s.stage === stage)
    if (!validStage) {
      return NextResponse.json(
        { error: `Invalid onboarding stage: ${stage}` },
        { status: 400 }
      )
    }

    // Record response
    const updatedSession = await recordOnboardingResponse(userId, stage as OnboardingStage, answer)

    // Get next stage
    const nextStage = getNextStage(stage as OnboardingStage)
    const nextStep = ONBOARDING_FLOW.find(s => s.stage === nextStage)

    // Check if onboarding is complete
    if (stage === 'complete') {
      await completeOnboardingSession(userId)
      return NextResponse.json(
        {
          message: 'Onboarding completed',
          session: updatedSession,
          isComplete: true,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        message: 'Response recorded',
        session: updatedSession,
        nextStep,
        isComplete: false,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DASP] Error recording response:', error)
    return NextResponse.json(
      {
        error: 'Failed to record response',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dasp/onboarding/skip
 * Skip to minimum viable onboarding
 */
export async function POST_skip(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Skipping onboarding for user: ${userId}`)

    await skipOnboarding(userId)

    return NextResponse.json(
      {
        message: 'Onboarding skipped - minimum viable profile created',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DASP] Error skipping onboarding:', error)
    return NextResponse.json(
      {
        error: 'Failed to skip onboarding',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
