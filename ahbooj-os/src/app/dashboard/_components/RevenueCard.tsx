import { formatTTD } from '@/lib/formatting'

interface RevenueCardProps {
  actual: number
  target: number
  monthLabel: string
  // Current day of month and total days for projection
  dayOfMonth?: number
  daysInMonth?: number
}

export function RevenueCard({ actual, target, monthLabel, dayOfMonth, daysInMonth }: RevenueCardProps) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  const remaining = Math.max(target - actual, 0)

  let barColour = 'bg-status-green'
  if (pct < 40) barColour = 'bg-status-red'
  else if (pct < 70) barColour = 'bg-terracotta'

  // Projected EOMonth based on daily run rate
  const projectedEOM = dayOfMonth && daysInMonth && dayOfMonth > 0
    ? Math.round((actual / dayOfMonth) * daysInMonth)
    : null

  const milestones = [25, 50, 75, 100]

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
          {projectedEOM !== null && projectedEOM > 0 && (
            <p className="text-xs text-muted mt-0.5">
              Proj. EOMonth:{' '}
              <span className={projectedEOM >= target ? 'text-status-green font-medium' : 'text-terracotta font-medium'}>
                {formatTTD(projectedEOM)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Progress bar with milestone markers */}
      <div className="relative w-full bg-espresso/10 rounded-full h-3 overflow-hidden mb-1">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColour}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Milestone ticks */}
      {target > 0 && (
        <div className="relative flex mb-2">
          {milestones.map(m => {
            const reached = pct >= m
            return (
              <div
                key={m}
                className="absolute -translate-x-1/2"
                style={{ left: `${m}%` }}
              >
                <div className={`w-0.5 h-1.5 mx-auto ${reached ? 'bg-terracotta' : 'bg-espresso/20'}`} />
                <p className={`text-xs mt-0.5 ${reached ? 'text-terracotta font-semibold' : 'text-muted'}`}>
                  {m}%
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted">
          {pct.toFixed(0)}% of goal
        </span>
        {remaining > 0 && (
          <span className="text-xs text-muted">
            {formatTTD(remaining)} to go
          </span>
        )}
        {remaining === 0 && (
          <span className="text-xs font-medium text-status-green">🎉 Goal reached!</span>
        )}
      </div>
    </div>
  )
}
