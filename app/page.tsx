"use client"

import { Suspense, lazy } from "react"

const VizzyChat = lazy(() => import("@/components/vizzy-chat").then(mod => ({ default: mod.VizzyChat })))

function LoadingFallback() {
  return (
    <div className="h-dvh flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading Vizzy Chat AI...</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="h-dvh w-full overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <VizzyChat />
      </Suspense>
    </main>
  )
}
