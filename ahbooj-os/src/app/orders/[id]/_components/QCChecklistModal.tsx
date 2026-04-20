'use client'

import { useState } from 'react'
import { X, CheckSquare, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const QC_ITEMS = [
  'All items packed correctly',
  'Quantities match the order exactly',
  'Proper labels applied to all packaging',
  'Temperature / refrigeration requirements met',
  'No damaged, broken, or imperfect items included',
  'Payment confirmed or payment arrangement agreed',
  'Delivery address verified with customer',
  'Customer contact number confirmed',
  'Items stored at correct temperature until handoff',
  'Allergen information included (if applicable)',
  'Order receipt or invoice included in package',
  'Batch numbers recorded in system',
  'Photo taken of packed order before dispatch',
  'Customer notified of dispatch / pickup time',
  'Delivery or driver arranged',
  'QC sign-off complete — ready to dispatch',
]

interface Props {
  orderId: string
  onConfirm: () => void
  onClose: () => void
}

export function QCChecklistModal({ orderId, onConfirm, onClose }: Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  const allChecked = QC_ITEMS.every((_, i) => checked[i])

  function toggle(idx: number) {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  async function handleConfirm() {
    if (!allChecked) return
    setSaving(true)

    const supabase = createClient()
    const checklistData: Record<string, boolean> = {}
    QC_ITEMS.forEach((label, i) => { checklistData[label] = !!checked[i] })

    await (supabase.from('order_qc_log').insert({
      order_id:  orderId,
      checklist: checklistData,
    }) as unknown as Promise<unknown>).catch(() => {})

    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10 flex-shrink-0">
          <div>
            <h3 className="font-display font-semibold text-espresso">Pre-Dispatch QC Checklist</h3>
            <p className="text-xs text-muted mt-0.5">Check all items before marking as dispatched</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <div className="space-y-2.5">
            {QC_ITEMS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left border transition-colors',
                  checked[idx]
                    ? 'bg-status-green/10 border-status-green/30 text-espresso'
                    : 'bg-cream border-espresso/10 hover:border-espresso/25 text-espresso'
                )}
              >
                {checked[idx]
                  ? <CheckSquare size={16} className="text-status-green flex-shrink-0 mt-0.5" />
                  : <Square size={16} className="text-muted flex-shrink-0 mt-0.5" />
                }
                <span className="text-sm">{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-espresso/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted">
              {Object.values(checked).filter(Boolean).length} / {QC_ITEMS.length} checked
            </span>
            {!allChecked && (
              <span className="text-xs text-status-amber font-medium">All items must be checked to dispatch</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!allChecked || saving}
              onClick={handleConfirm}
            >
              {saving ? 'Dispatching…' : 'Confirm & Dispatch'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
