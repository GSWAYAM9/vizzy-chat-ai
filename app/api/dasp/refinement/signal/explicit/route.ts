import { NextRequest, NextResponse } from 'next/server'
import {
  processExplicitSignal,
  processImplicitSignal,
  processConnectedDataSignal,
  runAISynthesis,
  type ExplicitSignal,
  type ImplicitSignal,
  type ConnectedDataSignal,
} from '@/lib/dasp/services/profile-refinement-engine'

/**
 * POST /api/dasp/refinement/signal/explicit
 * Record an explicit signal (user action on content)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate explicit signal
    const { userId, contentId, action, contentType, contentMetadata, userRating, dwellTime } =
      body

    if (!userId || !action || !contentType) {
      return NextResponse.json(
        {
          error: 'userId, action, and contentType are required',
        },
        { status: 400 }
      )
    }

    console.log(`[DASP] Recording explicit signal: ${action} from user ${userId}`)

    const signal: ExplicitSignal = {
      userId,
      timestamp: new Date(),
      contentId: contentId || '',
      action: action as any,
      contentType: contentType as any,
      contentMetadata: contentMetadata || {},
      userRating,
      dwellTime,
    }

    // Process signal asynchronously
    processExplicitSignal(signal).catch(error =>
      console.error('[DASP] Error processing explicit signal:', error)
    )

    return NextResponse.json(
      {
        message: 'Signal recorded successfully',
        signal,
      },
      { status: 202 } // Accepted (async processing)
    )
  } catch (error) {
    console.error('[DASP] Error recording explicit signal:', error)
    return NextResponse.json(
      {
        error: 'Failed to record signal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
