'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RowAction = {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface RowActionsProps {
  actions: RowAction[]
  align?: 'left' | 'right'
}

export function RowActions({ actions, align = 'right' }: RowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="p-1.5 rounded-lg text-muted hover:text-espresso hover:bg-espresso/10 transition-colors"
        aria-label="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-44 bg-warm-white rounded-xl shadow-xl border border-espresso/10 py-1 overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={e => e.stopPropagation()}
        >
          {actions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                type="button"
                disabled={action.disabled}
                onClick={() => { action.onClick(); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left',
                  action.variant === 'danger'
                    ? 'text-status-red hover:bg-red-50 disabled:opacity-40'
                    : 'text-espresso hover:bg-espresso/5 disabled:opacity-40'
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
