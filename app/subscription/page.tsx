'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/neon-auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import UsageMeter from '@/components/subscription/usage-meter'
import PurchaseModal from '@/components/subscription/purchase-modal'

interface SubscriptionStatus {
  tier: 'basic' | 'advanced' | 'premium'
  imagesUsedThisMonth: number
  monthlyLimit: number
  availableCredits: number
  creditsValue: number
  renewalDate: string
  lastPurchase?: string
  percentageUsed: number
}

export default function SubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchSubscriptionStatus()
    }
  }, [user, authLoading, router])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/subscription/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }

      const data = await response.json()
      setSubscriptionStatus(data.subscription)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-foreground/60 mb-6">{error}</p>
          <Button onClick={fetchSubscriptionStatus} className="bg-accent hover:bg-accent/90">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!subscriptionStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <p className="text-foreground/60">No subscription data found</p>
        </Card>
      </div>
    )
  }

  const tierLabels = {
    basic: 'Basic',
    advanced: 'Advanced',
    premium: 'Premium'
  }

  const tierColors = {
    basic: 'text-blue-500',
    advanced: 'text-purple-500',
    premium: 'text-yellow-500'
  }

  const isLimitReached = subscriptionStatus.percentageUsed >= 100
  const isNearLimit = subscriptionStatus.percentageUsed >= 80

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Your Subscription</h1>
          <p className="text-foreground/60">Manage your image generation credits and subscription tier</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tier Card */}
          <Card className="p-6 border border-border">
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground/60 uppercase tracking-wide mb-2">Current Tier</p>
              <h2 className={`text-3xl font-bold ${tierColors[subscriptionStatus.tier]}`}>
                {tierLabels[subscriptionStatus.tier]}
              </h2>
            </div>
            
            <div className="space-y-3 border-t border-border pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Monthly Limit</span>
                <span className="font-semibold text-foreground">{subscriptionStatus.monthlyLimit} images</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Renewal Date</span>
                <span className="font-semibold text-foreground">
                  {new Date(subscriptionStatus.renewalDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Credits Card */}
          <Card className="p-6 border border-border">
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground/60 uppercase tracking-wide mb-2">Available Credits</p>
              <h2 className="text-3xl font-bold text-accent">
                {subscriptionStatus.availableCredits}
              </h2>
              <p className="text-sm text-foreground/60 mt-1">
                = {subscriptionStatus.creditsValue} additional images
              </p>
            </div>

            <Button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
            >
              Buy More Credits
            </Button>
          </Card>
        </div>

        {/* Usage Meter */}
        <div className="mb-8">
          <UsageMeter 
            used={subscriptionStatus.imagesUsedThisMonth}
            limit={subscriptionStatus.monthlyLimit}
            percentage={subscriptionStatus.percentageUsed}
            isLimitReached={isLimitReached}
            isNearLimit={isNearLimit}
          />
        </div>

        {/* Warning Messages */}
        {isLimitReached && (
          <Card className="p-4 border border-destructive/50 bg-destructive/5 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-destructive">Monthly limit reached</h3>
                <p className="text-sm text-foreground/60 mt-1">
                  You&apos;ve used all {subscriptionStatus.monthlyLimit} images for this month. Purchase credits to continue creating.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isNearLimit && !isLimitReached && (
          <Card className="p-4 border border-yellow-500/50 bg-yellow-500/5 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-600">Approaching limit</h3>
                <p className="text-sm text-foreground/60 mt-1">
                  You&apos;ve used {subscriptionStatus.percentageUsed}% of your monthly quota. Consider purchasing credits now.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-foreground/60 mb-1">Images Used</p>
              <p className="text-2xl font-bold text-foreground">
                {subscriptionStatus.imagesUsedThisMonth}/{subscriptionStatus.monthlyLimit}
              </p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-foreground/60 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-accent">
                {Math.max(0, subscriptionStatus.monthlyLimit - subscriptionStatus.imagesUsedThisMonth)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal 
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          setShowPurchaseModal(false)
          fetchSubscriptionStatus()
        }}
      />
    </div>
  )
}
