interface UsageMeterProps {
  used: number
  limit: number
  percentage: number
}

export default function UsageMeter({ used, limit, percentage }: UsageMeterProps) {
  // Ensure numeric values
  const safeUsed = Number(used) || 0
  const safeLimit = Number(limit) || 200
  const safePercentage = Number(percentage) || 0
  const remaining = Math.max(0, safeLimit - safeUsed)

  const getBarColor = () => {
    if (safePercentage >= 100) return 'bg-red-500'
    if (safePercentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTextColor = () => {
    if (safePercentage >= 100) return 'text-red-600'
    if (safePercentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{safeUsed} / {safeLimit} images</span>
        <span className={`text-sm font-bold ${getTextColor()}`}>{Math.round(safePercentage)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.min(safePercentage, 100)}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">{safeUsed}</p>
          <p>Used</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{remaining}</p>
          <p>Remaining</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{safeLimit}</p>
          <p>Limit</p>
        </div>
      </div>
    </div>
  )
}
