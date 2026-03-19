import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionStatus, trackImageCreation, getSubscriptionStatus as getStatus } from '@/lib/subscription/subscription-service'

/**
 * GET /api/subscription/status
 * Get current subscription and usage status for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - User ID required' },
        { status: 401 }
      )
    }

    const status = await getStatus(userId)
    if (!status) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(status, { status: 200 })
  } catch (error) {
    console.error('[SUBSCRIPTION] Error fetching status:', error)
    return NextResponse.json(
      { message: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
