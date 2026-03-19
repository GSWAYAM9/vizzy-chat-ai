interface UsageMeterProps {
  used: number
  limit: number
  percentage: number
}

export default function UsageMeter({ used, limit, percentage }: UsageMeterProps) {
  const getBarColor = () => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTextColor = () => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{used} / {limit} images</span>
        <span className={`text-sm font-bold ${getTextColor()}`}>{Math.round(percentage)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">{used}</p>
          <p>Used</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{limit - used}</p>
          <p>Remaining</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{limit}</p>
          <p>Limit</p>
        </div>
      </div>
    </div>
  )
}
