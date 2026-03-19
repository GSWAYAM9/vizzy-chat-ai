'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreditOption {
  credits: number
  price: number
  bonus: number
  popular?: boolean
}

const CREDIT_OPTIONS: CreditOption[] = [
  { credits: 5, price: 4.99, bonus: 0 },
  { credits: 10, price: 9.99, bonus: 0 },
  { credits: 25, price: 24.99, bonus: 5, popular: true },
  { credits: 50, price: 49.99, bonus: 10 },
]

export default function PurchaseModal({ isOpen, onClose, onSuccess }: PurchaseModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(1)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useCustom, setUseCustom] = useState(false)

  if (!isOpen) return null

  const handlePurchase = async () => {
    try {
      setLoading(true)
      setError(null)

      const creditsToAdd = useCustom ? parseInt(customAmount) : CREDIT_OPTIONS[selectedOption!].credits

      if (!creditsToAdd || creditsToAdd <= 0) {
        setError('Please enter a valid amount')
        return
      }

      const response = await fetch('/api/subscription/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsToAdd }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to purchase credits')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const selectedCredit = !useCustom ? CREDIT_OPTIONS[selectedOption!] : null
  const totalImages = !useCustom ? (CREDIT_OPTIONS[selectedOption!].credits + CREDIT_OPTIONS[selectedOption!].bonus) * 20 : parseInt(customAmount) * 20

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border border-border">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Purchase Credits</h2>
            <p className="text-foreground/60 text-sm sm:text-base mt-1">Each credit gives you 20 additional images</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Credit Options */}
          {!useCustom ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {CREDIT_OPTIONS.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    selectedOption === idx
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-border'
                  }`}
                >
                  {option.popular && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                      Popular
                    </div>
                  )}

                  <div className="text-left">
                    <p className="text-lg font-bold text-foreground">{option.credits} Credits</p>
                    {option.bonus > 0 && (
                      <p className="text-sm text-accent">+{option.bonus} bonus</p>
                    )}
                    <p className="text-2xl font-bold text-foreground mt-2">${option.price}</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      = {(option.credits + option.bonus) * 20} images
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                How many credits?
              </label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter number of credits"
                className="mb-2"
              />
              {customAmount && (
                <p className="text-sm text-foreground/60">
                  {parseInt(customAmount) * 20} images at $0.99 per credit = ${(parseInt(customAmount) * 0.99).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Toggle Custom */}
          <button
            onClick={() => {
              setUseCustom(!useCustom)
              setError(null)
            }}
            className="text-sm text-accent hover:text-accent/80 mb-6"
          >
            {useCustom ? 'Choose preset amount' : 'Enter custom amount'}
          </button>

          {/* Summary */}
          {selectedCredit && !useCustom && (
            <div className="p-4 bg-secondary/50 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground/60">Credits</span>
                <span className="font-semibold text-foreground">{selectedCredit.credits + selectedCredit.bonus}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground/60">Images</span>
                <span className="font-semibold text-foreground">{totalImages}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-accent">${selectedCredit.price}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={loading || (useCustom && !customAmount)}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? 'Processing...' : `Purchase${selectedCredit ? ` - $${selectedCredit.price}` : ''}`}
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-foreground/40 text-center mt-4">
            Credits are non-refundable and expire after 1 year of inactivity
          </p>
        </div>
      </Card>
    </div>
  )
}
