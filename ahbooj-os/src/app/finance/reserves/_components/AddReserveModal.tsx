'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function AddReserveModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const today  = new Date().toISOString().split('T')[0]

  const [snapshotDate,      setSnapshotDate]      = useState(today)
  const [totalCash,         setTotalCash]         = useState('')
  const [operatingReserve,  setOperatingReserve]  = useState('')
  const [personalFloat,     setPersonalFloat]     = useState('')
  const [reserveWeeks,      setReserveWeeks]      = useState('')
  const [notes,             setNotes]             = useState('')
  const [saving,            setSaving]            = useState(false)
  const [error,             setError]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!totalCash) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('reserves').insert({
      snapshot_date:      snapshotDate,
      total_cash:         parseFloat(totalCash),
      operating_reserve:  operatingReserve  ? parseFloat(operatingReserve)  : null,
      personal_float:     personalFloat     ? parseFloat(personalFloat)     : null,
      reserve_weeks_covered: reserveWeeks   ? parseFloat(reserveWeeks)      : null,
      notes:              notes.trim() || null,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Log Reserve Snapshot</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Snapshot Date</label>
              <input type="date" value={snapshotDate} onChange={e => setSnapshotDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Total Cash (TT$) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={totalCash} onChange={e => setTotalCash(e.target.value)} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Operating Reserve (TT$)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={operatingReserve} onChange={e => setOperatingReserve(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Personal Float (TT$)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={personalFloat} onChange={e => setPersonalFloat(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Reserve Weeks Covered</label>
            <input type="number" min="0" step="0.1" placeholder="e.g. 6.5" value={reserveWeeks} onChange={e => setReserveWeeks(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Context, what changed…" />
          </div>
          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Snapshot'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
