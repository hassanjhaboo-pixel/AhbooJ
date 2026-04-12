import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'green' | 'amber' | 'red' | 'gold' | 'muted' | 'terracotta'

const variantStyles: Record<BadgeVariant, string> = {
  green:      'bg-status-green/15 text-status-green border-status-green/30',
  amber:      'bg-status-amber/15 text-amber-700 border-status-amber/30',
  red:        'bg-status-red/15 text-status-red border-status-red/30',
  gold:       'bg-gold/15 text-amber-800 border-gold/30',
  muted:      'bg-muted/10 text-muted border-muted/20',
  terracotta: 'bg-terracotta/15 text-terracotta border-terracotta/30',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  )
}

// Helper: choose badge variant based on margin percentage
export function marginBadgeVariant(pct: number): BadgeVariant {
  if (pct >= 55) return 'green'
  if (pct >= 35) return 'amber'
  return 'red'
}
