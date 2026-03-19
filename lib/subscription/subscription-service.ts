/**
 * Subscription Management Service
 * Handles subscription tiers, image tracking, and credits
 */

import { sql } from '@/lib/neon-client'
import {
  SUBSCRIPTION_TIERS,
  CREDIT_CONFIG,
  getTierByName,
  calculateAdditionalImages,
  calculateTotalImages,
} from './subscription-config'

/**
 * Initialize subscription tiers in database
 */
export async function initializeSubscriptionTiers() {
  try {
    // Check if already initialized
    const existing = await sql`SELECT COUNT(*) as count FROM subscription_tiers`
    if (existing[0].count > 0) {
      console.log('[SUBSCRIPTION] Tiers already initialized')
      return
    }

    // Insert tiers
    for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
      await sql`
        INSERT INTO subscription_tiers (name, display_name, monthly_image_limit, price_usd, description)
        VALUES (${tier.name}, ${tier.displayName}, ${tier.monthlyImageLimit}, ${tier.priceUsd}, ${tier.description})
      `
    }
    console.log('[SUBSCRIPTION] Tiers initialized successfully')
  } catch (error) {
    console.error('[SUBSCRIPTION] Error initializing tiers:', error)
    throw error
  }
}

/**
 * Create subscription for new user (defaults to BASIC tier)
 */
export async function createSubscription(userId: string) {
  try {
    const basicTier = getTierByName('basic')
    const tierResult = await sql`
      SELECT id FROM subscription_tiers WHERE name = 'basic'
    `

    if (!tierResult || tierResult.length === 0) {
      throw new Error('Basic tier not found')
    }

    const tierId = tierResult[0].id
    const now = new Date()
    const billingCycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const billingCycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    await sql`
      INSERT INTO user_subscriptions (user_id, tier_id, billing_cycle_start, billing_cycle_end)
      VALUES (${userId}, ${tierId}, ${billingCycleStart.toISOString().split('T')[0]}, ${billingCycleEnd.toISOString().split('T')[0]})
    `

    // Create credits record
    await sql`
      INSERT INTO user_credits (user_id, available_credits)
      VALUES (${userId}, 0)
    `

    console.log(`[SUBSCRIPTION] Subscription created for user ${userId}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error creating subscription:', error)
    throw error
  }
}

/**
 * Get user's current subscription status
 */
export async function getSubscriptionStatus(userId: string) {
  try {
    const result = await sql`
      SELECT 
        us.id,
        us.user_id,
        st.name as tier_name,
        st.display_name as tier_display_name,
        st.monthly_image_limit,
        st.price_usd as tier_price,
        us.current_month_images,
        us.billing_cycle_start,
        us.billing_cycle_end,
        us.is_active,
        uc.available_credits,
        uc.total_credits_purchased
      FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id
      LEFT JOIN user_credits uc ON us.user_id = uc.user_id
      WHERE us.user_id = ${userId}
    `

    if (!result || result.length === 0) {
      return null
    }

    const sub = result[0]
    const additionalImages = calculateAdditionalImages(sub.available_credits || 0)
    const totalImageLimit = sub.monthly_image_limit + additionalImages
    const remainingImages = totalImageLimit - sub.current_month_images

    return {
      userId: sub.user_id,
      tierId: sub.id,
      tierName: sub.tier_name,
      tierDisplayName: sub.tier_display_name,
      monthlyImageLimit: sub.monthly_image_limit,
      currentMonthImages: sub.current_month_images,
      additionalImagesFromCredits: additionalImages,
      totalImageLimit,
      remainingImages,
      billingCycleStart: sub.billing_cycle_start,
      billingCycleEnd: sub.billing_cycle_end,
      isActive: sub.is_active,
      availableCredits: sub.available_credits || 0,
      totalCreditsPurchased: sub.total_credits_purchased || 0,
    }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting subscription status:', error)
    throw error
  }
}

/**
 * Track image creation
 */
export async function trackImageCreation(userId: string, imageId: string) {
  try {
    const subscription = await getSubscriptionStatus(userId)
    if (!subscription) {
      throw new Error('Subscription not found for user')
    }

    // Check if user has exceeded limit
    if (subscription.remainingImages <= 0) {
      throw new Error('Image limit exceeded. Purchase credits to continue.')
    }

    // Record usage
    await sql`
      INSERT INTO image_usage (user_id, subscription_tier_id, image_id)
      SELECT ${userId}, st.id, ${imageId}
      FROM subscription_tiers st
      WHERE st.name = ${subscription.tierName}
    `

    // Update current month count
    await sql`
      UPDATE user_subscriptions
      SET current_month_images = current_month_images + 1
      WHERE user_id = ${userId}
    `

    console.log(`[SUBSCRIPTION] Image tracked for user ${userId}`)
    return {
      success: true,
      remainingImages: subscription.remainingImages - 1,
    }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error tracking image:', error)
    throw error
  }
}

/**
 * Add credits to user account
 */
export async function addCredits(userId: string, numCredits: number) {
  try {
    await sql`
      UPDATE user_credits
      SET 
        available_credits = available_credits + ${numCredits},
        total_credits_purchased = total_credits_purchased + ${numCredits},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `

    console.log(`[SUBSCRIPTION] Added ${numCredits} credits to user ${userId}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error adding credits:', error)
    throw error
  }
}

/**
 * Deduct credits when user uses them
 */
export async function deductCredits(userId: string, numCredits: number) {
  try {
    const result = await sql`
      UPDATE user_credits
      SET available_credits = available_credits - ${numCredits}
      WHERE user_id = ${userId} AND available_credits >= ${numCredits}
      RETURNING available_credits
    `

    if (!result || result.length === 0) {
      throw new Error('Insufficient credits')
    }

    console.log(`[SUBSCRIPTION] Deducted ${numCredits} credits from user ${userId}`)
    return result[0].available_credits
  } catch (error) {
    console.error('[SUBSCRIPTION] Error deducting credits:', error)
    throw error
  }
}

/**
 * Record credit purchase
 */
export async function recordCreditPurchase(
  userId: string,
  numCredits: number,
  transactionId: string,
  paymentStatus: string = 'completed'
) {
  try {
    const costUsd = numCredits * CREDIT_CONFIG.CREDIT_PRICE_USD

    await sql`
      INSERT INTO credit_purchases (user_id, credits_purchased, cost_usd, transaction_id, payment_status)
      VALUES (${userId}, ${numCredits}, ${costUsd}, ${transactionId}, ${paymentStatus})
    `

    // Add credits to user account if payment is completed
    if (paymentStatus === 'completed') {
      await addCredits(userId, numCredits)
    }

    console.log(`[SUBSCRIPTION] Recorded purchase of ${numCredits} credits for user ${userId}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error recording credit purchase:', error)
    throw error
  }
}

/**
 * Get credit purchase history
 */
export async function getCreditPurchaseHistory(userId: string) {
  try {
    const result = await sql`
      SELECT 
        id,
        credits_purchased,
        cost_usd,
        transaction_id,
        payment_status,
        created_at
      FROM credit_purchases
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return result || []
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting purchase history:', error)
    throw error
  }
}

/**
 * Reset monthly image count (should run on subscription renewal)
 */
export async function resetMonthlyImageCount(userId: string) {
  try {
    const now = new Date()
    const billingCycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const billingCycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    await sql`
      UPDATE user_subscriptions
      SET 
        current_month_images = 0,
        billing_cycle_start = ${billingCycleStart.toISOString().split('T')[0]},
        billing_cycle_end = ${billingCycleEnd.toISOString().split('T')[0]}
      WHERE user_id = ${userId}
    `

    console.log(`[SUBSCRIPTION] Reset monthly count for user ${userId}`)
  } catch (error) {
    console.error('[SUBSCRIPTION] Error resetting monthly count:', error)
    throw error
  }
}
