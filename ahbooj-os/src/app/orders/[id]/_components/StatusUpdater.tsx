'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { QCChecklistModal } from './QCChecklistModal'
import { cn } from '@/lib/utils'

const PIPELINE: Array<{ value: string; label: string }> = [
  { value: 'draft',         label: 'Draft' },
  { value: 'pending',       label: 'Pending' },
  { value: 'confirmed',     label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready',         label: 'Ready' },
  { value: 'dispatched',    label: 'Dispatched' },
  { value: 'delivered',     label: 'Delivered' },
]

const STATUS_VARIANT: Record<string, 'amber' | 'terracotta' | 'gold' | 'green' | 'muted' | 'red'> = {
  draft:         'muted',
  pending:       'amber',
  confirmed:     'terracotta',
  in_production: 'gold',
  ready:         'green',
  dispatched:    'green',
  delivered:     'muted',
  cancelled:     'red',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', pending: 'Pending', confirmed: 'Confirmed',
  in_production: 'In Production', ready: 'Ready', dispatched: 'Dispatched',
  delivered: 'Delivered', cancelled: 'Cancelled',
}

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid',   label: 'Unpaid' },
  { value: 'partial',  label: 'Partial' },
  { value: 'paid',     label: 'Paid' },
]
const PAYMENT_VARIANT: Record<string, 'red' | 'amber' | 'green'> = {
  unpaid: 'red', partial: 'amber', paid: 'green',
}

export function StatusUpdater({
  orderId,
  currentStatus,
  currentPaymentStatus = 'unpaid',
}: {
  orderId: string
  currentStatus: string
  currentPaymentStatus?: string
}) {
  const router = useRouter()
  const [status,    setStatus]    = useState(currentStatus)
  const [payStatus, setPayStatus] = useState(currentPaymentStatus ?? 'unpaid')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [showQC,    setShowQC]    = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  const isCancelled = status === 'cancelled'

  async function doStatusUpdate(newStatus: string) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const updatePayload: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'delivered' && payStatus === 'unpaid') {
      updatePayload.payment_status = 'paid'
      updatePayload.paid_at = new Date().toISOString()
      setPayStatus('paid')
    }

    const { error: updateErr } = await supabase.from('orders').update(updatePayload).eq('id', orderId)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    // Fire order-status event and await + log any failures
    try {
      const res = await fetch('/api/events/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, oldStatus: status, newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[StatusUpdater] order-status event failed:', res.status, data)
      }
    } catch (err) {
      console.error('[StatusUpdater] order-status fetch error:', err)
    }

    // If payment auto-set to paid on delivery, fire payment event too
    if (newStatus === 'delivered' && payStatus === 'unpaid') {
      try {
        const res = await fetch('/api/events/order-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, newPaymentStatus: 'paid' }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.error('[StatusUpdater] order-payment event (auto-paid on delivery) failed:', res.status, data)
        }
      } catch (err) {
        console.error('[StatusUpdater] order-payment fetch error:', err)
      }
    }

    setStatus(newStatus)
    router.refresh()
    setSaving(false)
  }

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return

    // QC gate for dispatch
    if (newStatus === 'dispatched') {
      setPendingStatus(newStatus)
      setShowQC(true)
      return
    }

    await doStatusUpdate(newStatus)
  }

  async function handleQCConfirm() {
    setShowQC(false)
    if (pendingStatus) {
      await doStatusUpdate(pendingStatus)
      setPendingStatus(null)
    }
  }

  async function updatePaymentStatus(newPayStatus: string) {
    if (newPayStatus === payStatus) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ payment_status: newPayStatus, paid_at: newPayStatus === 'paid' ? new Date().toISOString() : null })
      .eq('id', orderId)

    if (updateErr) {
      setError(updateErr.message)
    } else {
      // Fire payment event and log any failures
      try {
        const res = await fetch('/api/events/order-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, newPaymentStatus: newPayStatus }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.error('[StatusUpdater] order-payment event failed:', res.status, data)
        }
      } catch (err) {
        console.error('[StatusUpdater] order-payment fetch error:', err)
      }

      setPayStatus(newPayStatus)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      {showQC && (
        <QCChecklistModal
          orderId={orderId}
          onConfirm={handleQCConfirm}
          onClose={() => { setShowQC(false); setPendingStatus(null) }}
        />
      )}

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
                    <div className={cn('h-px w-4 flex-shrink-0', isDone || isCurrent ? 'bg-terracotta' : 'bg-espresso/15')} />
                  )}
                  <button
                    type="button"
                    disabled={saving || (!isNext && !isDone && !isCurrent)}
                    onClick={() => updateStatus(step.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                      isCurrent  && 'bg-terracotta text-white shadow-sm',
                      isDone     && 'bg-espresso/10 text-espresso/60',
                      isNext     && 'bg-espresso/5 text-espresso hover:bg-terracotta/10 hover:text-terracotta border border-dashed border-espresso/20',
                      !isCurrent && !isDone && !isNext && 'text-muted/40 cursor-not-allowed',
                      saving     && 'opacity-50 cursor-wait'
                    )}
                  >
                    {step.label}
                    {isNext && step.value === 'dispatched' && (
                      <span className="ml-1 text-[10px] opacity-60">(QC)</span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Current status badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Status:</span>
            <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>
              {STATUS_LABEL[status] ?? status}
            </Badge>
          </div>

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

        {/* Payment status */}
        <div>
          <p className="text-xs font-medium text-espresso mb-2">Payment</p>
          <div className="flex gap-2">
            {PAYMENT_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                onClick={() => updatePaymentStatus(opt.value)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  payStatus === opt.value
                    ? opt.value === 'paid'
                      ? 'bg-status-green text-white border-status-green'
                      : opt.value === 'partial'
                      ? 'bg-status-amber text-espresso border-status-amber'
                      : 'bg-status-red text-white border-status-red'
                    : 'bg-white text-muted border-espresso/20 hover:border-espresso/40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-status-red">{error}</p>
        )}
      </div>
    </>
  )
}
