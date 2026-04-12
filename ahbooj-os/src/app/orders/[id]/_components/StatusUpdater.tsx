'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const PIPELINE: Array<{ value: string; label: string }> = [
  { value: 'pending',       label: 'Pending' },
  { value: 'confirmed',     label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready',         label: 'Ready' },
  { value: 'delivered',     label: 'Delivered' },
]

const STATUS_VARIANT: Record<string, 'amber' | 'terracotta' | 'gold' | 'green' | 'muted' | 'red'> = {
  pending:       'amber',
  confirmed:     'terracotta',
  in_production: 'gold',
  ready:         'green',
  delivered:     'muted',
  cancelled:     'red',
}

export function StatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter()
  const [status,  setStatus]  = useState(currentStatus)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const isCancelled = status === 'cancelled'

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setStatus(newStatus)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
      <h3 className="font-display font-semibold text-espresso mb-4">Order Status</h3>

      {/* Pipeline stepper */}
      {!isCancelled && (
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {PIPELINE.map((step, idx) => {
            const pipelineValues = PIPELINE.map(s => s.value)
            const currentIdx = pipelineValues.indexOf(status)
            const stepIdx    = pipelineValues.indexOf(step.value)
            const isDone     = stepIdx < currentIdx
            const isCurrent  = step.value === status
            const isNext     = stepIdx === currentIdx + 1

            return (
              <div key={step.value} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && (
                  <div className={cn('h-px w-5 flex-shrink-0', isDone || isCurrent ? 'bg-terracotta' : 'bg-espresso/15')} />
                )}
                <button
                  type="button"
                  disabled={saving || (!isNext && !isDone && !isCurrent)}
                  onClick={() => updateStatus(step.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    isCurrent  && 'bg-terracotta text-white shadow-sm',
                    isDone     && 'bg-espresso/10 text-espresso/60',
                    isNext     && 'bg-espresso/5 text-espresso hover:bg-terracotta/10 hover:text-terracotta border border-dashed border-espresso/20',
                    !isCurrent && !isDone && !isNext && 'text-muted/40 cursor-not-allowed',
                    saving     && 'opacity-50 cursor-wait'
                  )}
                >
                  {step.label}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Current status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Current:</span>
          <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>
            {status === 'in_production' ? 'In Production' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Cancel / uncancel */}
        {!isCancelled ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => updateStatus('cancelled')}
            className="text-xs text-status-red hover:underline disabled:opacity-50"
          >
            Cancel order
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => updateStatus('pending')}
            className="text-xs text-terracotta hover:underline disabled:opacity-50"
          >
            Reopen order
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-status-red">{error}</p>
      )}
    </div>
  )
}
