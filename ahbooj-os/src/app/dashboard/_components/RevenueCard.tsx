import { formatTTD } from '@/lib/formatting'

interface RevenueCardProps {
  actual: number
  target: number
  monthLabel: string
}

export function RevenueCard({ actual, target, monthLabel }: RevenueCardProps) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  const remaining = Math.max(target - actual, 0)

  let barColour = 'bg-status-green'
  if (pct < 40) barColour = 'bg-status-red'
  else if (pct < 70) barColour = 'bg-terracotta'

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            Revenue — {monthLabel}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-espresso">
            {formatTTD(actual)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Goal</p>
          <p className="font-semibold text-espresso">{formatTTD(target)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-espresso/10 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColour}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted">
          {pct.toFixed(0)}% of goal
        </span>
        {remaining > 0 && (
          <span className="text-xs text-muted">
            {formatTTD(remaining)} to go
          </span>
        )}
        {remaining === 0 && (
          <span className="text-xs font-medium text-status-green">Goal reached!</span>
        )}
      </div>
    </div>
  )
}
