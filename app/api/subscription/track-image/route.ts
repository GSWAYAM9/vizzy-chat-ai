import { NextRequest, NextResponse } from 'next/server'
import { trackImageCreation, getSubscriptionStatus } from '@/lib/subscription/subscription-service'

/**
 * POST /api/subscription/track-image
 * Track image creation against user's monthly quota
 * 
 * Body: { imageId: string }
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
    const { imageId } = body

    if (!imageId) {
      return NextResponse.json(
        { message: 'imageId is required' },
        { status: 400 }
      )
    }

    // Check if user would exceed limit before tracking
    const status = await getSubscriptionStatus(userId)
    if (!status) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (status.remainingImages <= 0) {
      return NextResponse.json(
        {
          message: 'Image limit exceeded',
          remainingImages: 0,
          suggestCreditsMessage: `You've used all ${status.totalImageLimit} images this month. Purchase credits to create more.`,
          creditsNeeded: Math.ceil(20 / CREDIT_CONFIG.IMAGES_PER_CREDIT),
        },
        { status: 429 }
      )
    }

    // Track the image
    const result = await trackImageCreation(userId, imageId)

    return NextResponse.json(
      {
        success: true,
        message: 'Image tracked successfully',
        remainingImages: result.remainingImages,
        usagePercentage: (status.currentMonthImages / status.totalImageLimit) * 100,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[SUBSCRIPTION] Error tracking image:', error)

    // Check if it's an "image limit exceeded" error
    if (error.message?.includes('Image limit exceeded')) {
      return NextResponse.json(
        { message: error.message },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to track image' },
      { status: 500 }
    )
  }
}

// Import config for error response
import { CREDIT_CONFIG } from '@/lib/subscription/subscription-config'
