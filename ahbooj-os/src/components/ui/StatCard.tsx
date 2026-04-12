import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: LucideIcon
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ label, value, subValue, icon: Icon, trend, className }: StatCardProps) {
  const trendPositive = trend && trend.value >= 0

  return (
    <div className={cn(
      'bg-cream rounded-card shadow-card border border-cream/60 p-5',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-espresso font-display leading-tight">{value}</p>
          {subValue && <p className="text-xs text-muted mt-0.5">{subValue}</p>}
        </div>
        {Icon && (
          <div className="p-2 bg-terracotta/10 rounded-lg flex-shrink-0 ml-3">
            <Icon size={18} className="text-terracotta" />
          </div>
        )}
      </div>
      {trend && (
        <div className={cn(
          'mt-3 text-xs font-medium flex items-center gap-1',
          trendPositive ? 'text-status-green' : 'text-status-red'
        )}>
          <span>{trendPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-muted font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
