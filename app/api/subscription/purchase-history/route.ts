import { NextRequest, NextResponse } from 'next/server'
import { getCreditPurchaseHistory } from '@/lib/subscription/subscription-service'

/**
 * GET /api/subscription/purchase-history
 * Get credit purchase history for authenticated user
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

    const history = await getCreditPurchaseHistory(userId)

    return NextResponse.json(
      {
        history: history.map((h: any) => ({
          id: h.id,
          creditsPurchased: h.credits_purchased,
          costUsd: h.cost_usd,
          transactionId: h.transaction_id,
          paymentStatus: h.payment_status,
          createdAt: h.created_at,
        })),
        totalPurchases: history.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[SUBSCRIPTION] Error fetching purchase history:', error)
    return NextResponse.json(
      { message: 'Failed to fetch purchase history' },
      { status: 500 }
    )
  }
}
