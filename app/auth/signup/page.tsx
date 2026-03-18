"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { signUp, isConfigured } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
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
      setError("Cannot sign up: Supabase is not configured. Please contact the administrator to set up authentication.")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await signUp(email, password, name)
      router.push("/auth/login")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed"
      setError(errorMessage)
      console.error("[v0] Signup error:", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="h-dvh w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Vizzy Account</CardTitle>
          <CardDescription>Join to start generating AI images</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-900/20 border border-amber-900/50 rounded flex gap-2">
              <AlertCircle className="size-5 text-amber-200 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">Setup Required</p>
                <p>Supabase authentication is not configured. Please set the environment variables:</p>
                <code className="text-xs bg-black/30 px-2 py-1 rounded block mt-1">
                  NEXT_PUBLIC_SUPABASE_URL<br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !isConfigured && (
              <div className="p-3 bg-amber-900/20 border border-amber-900/50 rounded text-amber-200 text-sm">
                {error}
              </div>
            )}
            {error && isConfigured && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading || !isConfigured}
              />
            </div>
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
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
