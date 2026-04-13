'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface Supplier { id: string; name: string }

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function AddPaymentModal({ suppliers, onClose }: { suppliers: Supplier[]; onClose: () => void }) {
  const router  = useRouter()
  const today   = new Date().toISOString().split('T')[0]

  const [supplierId,   setSupplierId]   = useState(suppliers[0]?.id ?? '')
  const [amount,       setAmount]       = useState('')
  const [description,  setDescription]  = useState('')
  const [dueDate,      setDueDate]      = useState('')
  const [paidDate,     setPaidDate]     = useState('')
  const [status,       setStatus]       = useState<'outstanding' | 'paid'>('outstanding')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  function handleStatusChange(s: 'outstanding' | 'paid') {
    setStatus(s)
    if (s === 'paid' && !paidDate) setPaidDate(today)
    if (s === 'outstanding')        setPaidDate('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !amount) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('supplier_payments').insert({
      supplier_id:  supplierId,
      amount:       parseFloat(amount),
      description:  description.trim() || null,
      due_date:     dueDate   || null,
      paid_date:    paidDate  || null,
      status,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Log Supplier Payment</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Supplier *</label>
            <select required value={supplierId} onChange={e => setSupplierId(e.target.value)} className={inputCls}>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount (TT$) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Invoice #, what for…" />
          </div>
          {/* Status toggle */}
          <div className="flex rounded-lg overflow-hidden border border-espresso/20">
            {(['outstanding', 'paid'] as const).map(s => (
              <button key={s} type="button" onClick={() => handleStatusChange(s)}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${status === s ? (s === 'paid' ? 'bg-status-green text-white' : 'bg-status-amber text-espresso') : 'text-muted hover:bg-espresso/5'}`}>
                {s}
              </button>
            ))}
          </div>
          {status === 'paid' && (
            <div>
              <label className={labelCls}>Paid Date</label>
              <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className={inputCls} />
            </div>
          )}
          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
