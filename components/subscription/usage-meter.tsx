'use client'

interface UsageMeterProps {
  used: number
  limit: number
  percentage: number
  isLimitReached: boolean
  isNearLimit: boolean
}

export default function UsageMeter({
  used,
  limit,
  percentage,
  isLimitReached,
  isNearLimit,
}: UsageMeterProps) {
  const getProgressColor = () => {
    if (isLimitReached) return 'bg-destructive'
    if (isNearLimit) return 'bg-yellow-500'
    return 'bg-accent'
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="text-lg font-semibold text-foreground">Monthly Image Usage</h3>
          <span className="text-2xl font-bold text-foreground">{percentage}%</span>
        </div>
        <p className="text-sm text-foreground/60">{used.toLocaleString()} of {limit.toLocaleString()} images used</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Usage Breakdown */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-foreground/60 uppercase tracking-wide mb-1">Used</p>
          <p className="text-xl font-bold text-foreground">{used}</p>
        </div>
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-foreground/60 uppercase tracking-wide mb-1">Remaining</p>
          <p className="text-xl font-bold text-accent">{Math.max(0, limit - used)}</p>
        </div>
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-foreground/60 uppercase tracking-wide mb-1">Limit</p>
          <p className="text-xl font-bold text-foreground">{limit}</p>
        </div>
      </div>
    </div>
  )
}
