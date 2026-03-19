/**
 * Subscription Configuration - Hyperparameters for tier limits and credits
 */

export const SUBSCRIPTION_TIERS = {
  BASIC: {
    name: 'basic',
    displayName: 'Basic',
    monthlyImageLimit: 200,
    priceUsd: 0, // Free tier
    description: 'Perfect for getting started',
  },
  ADVANCED: {
    name: 'advanced',
    displayName: 'Advanced',
    monthlyImageLimit: 400,
    priceUsd: 9.99,
    description: 'For regular creators',
  },
  PREMIUM: {
    name: 'premium',
    displayName: 'Premium',
    monthlyImageLimit: 800,
    priceUsd: 24.99,
    description: 'For professional creators',
  },
} as const

/**
 * Credit System Configuration
 * 1 credit = 20 additional images
 */
export const CREDIT_CONFIG = {
  IMAGES_PER_CREDIT: 20,
  CREDIT_PRICE_USD: 0.99, // $0.99 per credit
  MIN_CREDITS_TO_PURCHASE: 10,
  MAX_CREDITS_TO_PURCHASE: 1000,
} as const

/**
 * Get tier by name
 */
export function getTierByName(name: string) {
  const tier = Object.values(SUBSCRIPTION_TIERS).find((t) => t.name === name)
  if (!tier) {
    throw new Error(`Unknown subscription tier: ${name}`)
  }
  return tier
}

/**
 * Calculate cost for N credits
 */
export function calculateCreditCost(numCredits: number): number {
  return numCredits * CREDIT_CONFIG.CREDIT_PRICE_USD
}

/**
 * Calculate additional images from credits
 */
export function calculateAdditionalImages(credits: number): number {
  return credits * CREDIT_CONFIG.IMAGES_PER_CREDIT
}

/**
 * Calculate total available images for a user
 */
export function calculateTotalImages(
  tierImageLimit: number,
  availableCredits: number
): number {
  return tierImageLimit + calculateAdditionalImages(availableCredits)
}
