'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Loader2 } from 'lucide-react'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CREDIT_BUNDLES = [
  { credits: 5, label: '5 Credits', price: 4.95 },
  { credits: 10, label: '10 Credits', price: 9.99 },
  { credits: 25, label: '25 Credits', price: 24.99, bonus: 5, popular: true },
  { credits: 50, label: '50 Credits', price: 49.99, bonus: 10 },
]

export default function PurchaseModal({ isOpen, onClose, onSuccess }: PurchaseModalProps) {
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null)
  const [customCredits, setCustomCredits] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculatePrice = (credits: number) => {
    return (credits * 0.99).toFixed(2)
  }

  const getSelectedOption = () => {
    if (selectedBundle !== null) {
      return CREDIT_BUNDLES[selectedBundle]
    }
    if (customCredits) {
      const credits = parseInt(customCredits)
      return {
        credits,
        label: `${credits} Credits`,
        price: parseFloat(calculatePrice(credits)),
      }
    }
    return null
  }

  const selectedOption = getSelectedOption()
  const totalImages = selectedOption ? selectedOption.credits * 20 + (selectedOption.bonus ? selectedOption.bonus * 20 : 0) : 0

  const handlePurchase = async () => {
    if (!selectedOption) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/subscription/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: selectedOption.credits,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to purchase credits')
      }

      onSuccess()
      resetModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed'
      setError(message)
      console.error('[v0] Purchase error:', message)
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setSelectedBundle(null)
    setCustomCredits('')
    setError(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Purchase additional credits to extend your monthly image limit. Each credit equals 20 images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Bundles */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Preset Bundles</label>
            <div className="grid grid-cols-2 gap-2">
              {CREDIT_BUNDLES.map((bundle, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedBundle(selectedBundle === idx ? null : idx)
                    setCustomCredits('')
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedBundle === idx
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-gray-200 bg-white text-foreground hover:border-accent'
                  }`}
                >
                  <div className="text-sm font-semibold">{bundle.label}</div>
                  <div className="text-xs text-muted-foreground">${bundle.price.toFixed(2)}</div>
                  {bundle.bonus && (
                    <div className="text-xs text-green-600 font-semibold mt-1">+{bundle.bonus} bonus</div>
                  )}
                  {bundle.popular && (
                    <div className="text-xs bg-accent text-white rounded px-2 py-1 mt-1 inline-block">Popular</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium text-foreground">Custom Amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter credits"
                value={customCredits}
                onChange={(e) => {
                  setCustomCredits(e.target.value)
                  setSelectedBundle(null)
                }}
                min="1"
                max="500"
                className="flex-1"
              />
              <span className="flex items-center text-sm text-muted-foreground">credits</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Summary */}
          {selectedOption && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{selectedOption.credits} Credits</span>
                <span className="font-medium">${selectedOption.price.toFixed(2)}</span>
              </div>
              {selectedOption.bonus && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>+ {selectedOption.bonus} Bonus Credits</span>
                  <span>FREE</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span>Total Images</span>
                <span>{totalImages} images</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!selectedOption || loading}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy ${selectedOption?.credits || 'Credits'}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
