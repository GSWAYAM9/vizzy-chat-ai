import { NextRequest, NextResponse } from 'next/server'
import { recordCreditPurchase, addCredits, getSubscriptionStatus } from '@/lib/subscription/subscription-service'
import { CREDIT_CONFIG, calculateCreditCost } from '@/lib/subscription/subscription-config'

/**
 * POST /api/subscription/purchase-credits
 * Purchase additional image credits
 * 
 * Body: { numCredits: number, paymentMethodId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - User ID required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    let { numCredits } = body

    if (!numCredits || typeof numCredits !== 'number') {
      return NextResponse.json(
        { message: 'numCredits is required and must be a number' },
        { status: 400 }
      )
    }

    // Validate credit purchase limits
    if (numCredits < CREDIT_CONFIG.MIN_CREDITS_TO_PURCHASE) {
      return NextResponse.json(
        {
          message: `Minimum credits to purchase is ${CREDIT_CONFIG.MIN_CREDITS_TO_PURCHASE}`,
        },
        { status: 400 }
      )
    }

    if (numCredits > CREDIT_CONFIG.MAX_CREDITS_TO_PURCHASE) {
      return NextResponse.json(
        {
          message: `Maximum credits to purchase is ${CREDIT_CONFIG.MAX_CREDITS_TO_PURCHASE}`,
        },
        { status: 400 }
      )
    }

    const costUsd = calculateCreditCost(numCredits)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Record purchase (in real implementation, would integrate with Stripe/payment provider)
    await recordCreditPurchase(userId, numCredits, transactionId, 'completed')

    const subscription = await getSubscriptionStatus(userId)

    return NextResponse.json(
      {
        success: true,
        message: `Successfully purchased ${numCredits} credits`,
        transactionId,
        costUsd,
        creditsAdded: numCredits,
        additionalImages: numCredits * CREDIT_CONFIG.IMAGES_PER_CREDIT,
        subscription: {
          availableCredits: subscription?.availableCredits,
          totalImageLimit: subscription?.totalImageLimit,
          remainingImages: subscription?.remainingImages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[SUBSCRIPTION] Error purchasing credits:', error)
    return NextResponse.json(
      { message: 'Failed to purchase credits' },
      { status: 500 }
    )
  }
}
