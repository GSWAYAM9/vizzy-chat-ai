"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { SetupRequired } from "@/components/setup-required"
import { VizzyChat } from "@/components/vizzy-chat"

export default function Home() {
  const router = useRouter()
  const { isLoading, isConfigured, user } = useAuth()

  useEffect(() => {
    // Redirect to login if Supabase is configured but user is not authenticated
    if (!isLoading && isConfigured && !user) {
      router.push("/auth/login")
    }
  }, [isLoading, isConfigured, user, router])

  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Vizzy Chat AI...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return <SetupRequired />
  }

  if (!user) {
    return null // Redirecting to login
  }

  return (
    <main className="h-dvh w-full overflow-hidden">
      <VizzyChat />
    </main>
  )
}


