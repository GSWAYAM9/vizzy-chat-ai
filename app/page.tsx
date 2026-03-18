"use client"

import { useAuth } from "@/lib/auth-context"
import { SetupRequired } from "@/components/setup-required"
import { VizzyChat } from "@/components/vizzy-chat"

export default function Home() {
  const { isLoading, isConfigured } = useAuth()

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

  return (
    <main className="h-dvh w-full overflow-hidden">
      <VizzyChat />
    </main>
  )
}


