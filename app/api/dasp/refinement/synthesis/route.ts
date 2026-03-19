import { NextRequest, NextResponse } from 'next/server'
import { runAISynthesis } from '@/lib/dasp/services/profile-refinement-engine'

/**
 * POST /api/dasp/refinement/synthesis
 * Run AI synthesis on recent signals to generate profile improvement suggestions
 * This is typically called on a schedule (e.g., weekly)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, timeWindowDays } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Running AI synthesis for user: ${userId}`)

    // Run synthesis asynchronously
    const windowDays = timeWindowDays || 7
    runAISynthesis(userId, windowDays).catch(error =>
      console.error('[DASP] Error running synthesis:', error)
    )

    return NextResponse.json(
      {
        message: 'AI synthesis started',
        userId,
        timeWindowDays: windowDays,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('[DASP] Error starting synthesis:', error)
    return NextResponse.json(
      {
        error: 'Failed to start synthesis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
