'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/neon-auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, Zap } from 'lucide-react'
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
      const response = await fetch('/api/subscription/status', {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }
      
      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscription'
      setError(message)
      console.error('[v0] Subscription error:', message)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-accent text-white'
      case 'advanced':
        return 'bg-blue-500 text-white'
      case 'basic':
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'premium':
        return '800 images/month - Perfect for daily creation'
      case 'advanced':
        return '400 images/month - Great for regular use'
      case 'basic':
      default:
        return '200 images/month - Free tier'
    }
  }

  if (loading && !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
          <p className="text-foreground">Loading subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Your Subscription</h1>
          <p className="text-muted-foreground">Manage your plan and track your image creation usage</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6 flex gap-4">
              <AlertCircle className="text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Subscription</h3>
                <p className="text-sm text-red-800 mt-1">{error}</p>
                <Button 
                  onClick={fetchSubscriptionStatus}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {subscriptionStatus && (
          <div className="space-y-6">
            {/* Current Tier Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`inline-block px-4 py-2 rounded-lg font-semibold mb-2 ${getTierColor(subscriptionStatus.tier)}`}>
                      {subscriptionStatus.tier.charAt(0).toUpperCase() + subscriptionStatus.tier.slice(1)} Tier
                    </div>
                    <p className="text-muted-foreground">{getTierDescription(subscriptionStatus.tier)}</p>
                    <p className="text-sm text-muted-foreground mt-2">Renews on {new Date(subscriptionStatus.renewalDate).toLocaleDateString()}</p>
                  </div>
                  {subscriptionStatus.tier !== 'premium' && (
                    <Button className="bg-accent hover:bg-accent/90">
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Meter */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Image Usage</CardTitle>
                <CardDescription>Track your image creation against your monthly limit</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageMeter
                  used={subscriptionStatus.imagesUsedThisMonth}
                  limit={subscriptionStatus.monthlyLimit}
                  percentage={subscriptionStatus.percentageUsed}
                />
              </CardContent>
            </Card>

            {/* Credits Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Available Credits
                </CardTitle>
                <CardDescription>Purchase additional credits to extend your monthly limit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{subscriptionStatus.availableCredits}</p>
                    <p className="text-sm text-muted-foreground">credits available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      = {subscriptionStatus.creditsValue} additional images
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowPurchaseModal(true)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    Buy Credits
                  </Button>
                </div>
                
                {subscriptionStatus.lastPurchase && (
                  <p className="text-xs text-muted-foreground border-t pt-4">
                    Last purchase: {new Date(subscriptionStatus.lastPurchase).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Usage Warning */}
            {subscriptionStatus.percentageUsed >= 80 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6 flex gap-4">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Approaching Limit</h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      You've used {subscriptionStatus.percentageUsed}% of your monthly limit. Consider buying credits or upgrading your plan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            setShowPurchaseModal(false)
            fetchSubscriptionStatus()
          }}
        />
      </div>
    </main>
  )
}
