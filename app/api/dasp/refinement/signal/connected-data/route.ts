import { NextRequest, NextResponse } from 'next/server'
import {
  processConnectedDataSignal,
  type ConnectedDataSignal,
} from '@/lib/dasp/services/profile-refinement-engine'

/**
 * POST /api/dasp/refinement/signal/connected-data
 * Record a signal from connected data sources (journal, wearable, weather, calendar)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { userId, source, dataType, rawData, extractedInsights } = body

    if (!userId || !source) {
      return NextResponse.json(
        { error: 'userId and source are required' },
        { status: 400 }
      )
    }

    console.log(`[DASP] Recording connected data signal from: ${source}`)

    const signal: ConnectedDataSignal = {
      userId,
      timestamp: new Date(),
      source: source as any,
      dataType: dataType || source,
      rawData: rawData || {},
      extractedInsights: extractedInsights || {},
    }

    // Process signal asynchronously
    processConnectedDataSignal(signal).catch(error =>
      console.error('[DASP] Error processing connected data signal:', error)
    )

    return NextResponse.json(
      {
        message: 'Connected data signal recorded successfully',
        signal,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('[DASP] Error recording connected data signal:', error)
    return NextResponse.json(
      {
        error: 'Failed to record signal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
