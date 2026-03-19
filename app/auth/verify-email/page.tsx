'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
          setEmail(data.email)
          console.log('[v0] Email verified successfully:', data.email)
        } else {
          setStatus('error')
          setMessage(data.message || 'Verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred during verification')
        console.error('[v0] Verification error:', error)
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
                <p className="text-muted-foreground">Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <h1 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h1>
                <p className="text-muted-foreground mb-4">
                  Your email <span className="font-semibold text-foreground">{email}</span> has been successfully verified.
                </p>
                <p className="text-muted-foreground mb-6">
                  You can now use all features of Vizzy Chat AI.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Continue to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-red-500 text-5xl mb-4">✕</div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="space-y-2">
                  <Link
                    href="/auth/signup"
                    className="block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Try Signing Up Again
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block border border-primary text-primary px-6 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble? Contact{' '}
          <a href="mailto:support@vizzy.ai" className="text-primary hover:underline">
            support@vizzy.ai
          </a>
        </p>
      </div>
    </div>
  )
}
