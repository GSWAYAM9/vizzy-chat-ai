import { Suspense } from "react"
import { VizzyChat } from "@/components/vizzy-chat"

function VizzyChatContent() {
  return <VizzyChat />
}

export default function Home() {
  return (
    <main className="h-dvh">
      <Suspense fallback={
        <div className="h-dvh flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Vizzy...</p>
          </div>
        </div>
      }>
        <VizzyChatContent />
      </Suspense>
    </main>
  )
}
