import { cn } from '@/lib/utils'
import { marginStatus, marginStatusLabel, MARGIN_RULES, type Channel } from '@/lib/pricing'
import { formatPercent } from '@/lib/formatting'

interface MarginIndicatorProps {
  margin: number
  channel: Channel
  showBar?: boolean
  className?: string
}

// Threshold tick positions on a 0–100 bar
const TICKS = [
  { pct: MARGIN_RULES.cafe_floor,    label: `${MARGIN_RULES.cafe_floor}%` },
  { pct: MARGIN_RULES.cafe_danger,   label: `${MARGIN_RULES.cafe_danger}%` },
  { pct: MARGIN_RULES.direct_floor,  label: `${MARGIN_RULES.direct_floor}%` },
  { pct: MARGIN_RULES.direct_strong, label: `${MARGIN_RULES.direct_strong}%` },
]

function barColour(margin: number, channel: Channel): string {
  const s = marginStatus(margin, channel)
  return {
    strong:  'bg-status-green',
    healthy: 'bg-gold',
    warning: 'bg-status-amber',
    danger:  'bg-status-red',
  }[s]
}

function badgeColour(margin: number, channel: Channel): string {
  const s = marginStatus(margin, channel)
  return {
    strong:  'bg-status-green/15 text-status-green border-status-green/30',
    healthy: 'bg-gold/15 text-amber-800 border-gold/30',
    warning: 'bg-status-amber/15 text-amber-700 border-status-amber/30',
    danger:  'bg-status-red/15 text-status-red border-status-red/30',
  }[s]
}

export function MarginIndicator({ margin, channel, showBar = false, className }: MarginIndicatorProps) {
  const status = marginStatus(margin, channel)
  const label  = marginStatusLabel(status)

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-espresso">
          {formatPercent(margin)}
        </span>
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
          badgeColour(margin, channel)
        )}>
          {label}
        </span>
      </div>

      {showBar && (
        <div className="relative">
          {/* Bar track */}
          <div className="w-full h-2 bg-espresso/10 rounded-full overflow-hidden">
            <div
              className={cn('h-2 rounded-full transition-all duration-300', barColour(margin, channel))}
              style={{ width: `${Math.min(margin, 100)}%` }}
            />
          </div>
          {/* Threshold ticks */}
          <div className="relative w-full h-3 mt-0.5">
            {TICKS.map(tick => (
              <div
                key={tick.pct}
                className="absolute flex flex-col items-center"
                style={{ left: `${tick.pct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-1.5 bg-espresso/20" />
                <span className="text-[9px] text-muted leading-none mt-0.5">{tick.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
