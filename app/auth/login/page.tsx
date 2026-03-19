"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/neon-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithGoogle, isConfigured } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isConfigured) {
      setError("Supabase is not configured yet. Please set up your Supabase credentials in the environment variables.")
    }
  }, [isConfigured])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConfigured) {
      setError("Cannot sign in: Supabase is not configured. Please contact the administrator to set up authentication.")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push("/")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      console.error("[v0] Login error:", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setError("Cannot sign in: Supabase is not configured. Please contact the administrator to set up authentication.")
      return
    }

    try {
      await signInWithGoogle()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Google sign-in failed"
      setError(errorMessage)
      console.error("[v0] Google sign-in error:", errorMessage)
    }
  }

  return (
    <main className="h-dvh w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to Vizzy</CardTitle>
          <CardDescription>Create stunning AI images with your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConfigured && (
            <div className="p-3 bg-amber-900/20 border border-amber-900/50 rounded flex gap-2">
              <AlertCircle className="size-5 text-amber-200 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">Setup Required</p>
                <p>Supabase authentication is not configured. To enable sign in, please add these environment variables in Settings → Vars:</p>
                <code className="text-xs bg-black/30 px-2 py-1 rounded block mt-2 space-y-1">
                  <div>NEXT_PUBLIC_SUPABASE_URL</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                </code>
                <p className="mt-2 text-xs">Once added, refresh this page and you'll be able to sign in.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && isConfigured && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !isConfigured}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || !isConfigured}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isConfigured}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={!isConfigured}
          >
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
