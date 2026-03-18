export default function Loading() {
  return (
    <div className="h-dvh flex items-center justify-center bg-background">
      <div className="space-y-4">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-center text-muted-foreground">Loading Vizzy...</p>
      </div>
    </div>
  )
}
