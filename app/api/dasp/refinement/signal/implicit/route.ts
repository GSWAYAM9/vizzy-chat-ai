import { NextRequest, NextResponse } from 'next/server'
import {
  processImplicitSignal,
  type ImplicitSignal,
} from '@/lib/dasp/services/profile-refinement-engine'

/**
 * POST /api/dasp/refinement/signal/implicit
 * Record an implicit signal from user behavior patterns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { userId, signalType, data, confidence, context } = body

    if (!userId || !signalType) {
      return NextResponse.json(
        { error: 'userId and signalType are required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Recording implicit signal: ${signalType} from user ${userId}`)

    const signal: ImplicitSignal = {
      userId,
      timestamp: new Date(),
      signalType: signalType as any,
      data: data || {},
      confidence: confidence || 0.5,
      context: context || '',
    }

    // Process signal asynchronously
    processImplicitSignal(signal).catch(error =>
      console.error('[DASP] Error processing implicit signal:', error)
    )

    return NextResponse.json(
      {
        message: 'Implicit signal recorded successfully',
        signal,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('[DASP] Error recording implicit signal:', error)
    return NextResponse.json(
      {
        error: 'Failed to record signal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
