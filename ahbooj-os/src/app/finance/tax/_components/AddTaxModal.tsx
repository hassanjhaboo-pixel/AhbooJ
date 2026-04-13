'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const TAX_CATS = ['vat-collected', 'vat-paid', 'income-tax', 'wc-contribution', 'other']

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function AddTaxModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const today  = new Date().toISOString().split('T')[0]

  const [entryDate,   setEntryDate]   = useState(today)
  const [category,    setCategory]    = useState('vat-collected')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [reference,   setReference]   = useState('')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('tax_entries').insert({
      entry_date:  entryDate,
      category,
      description: description.trim() || null,
      amount:      parseFloat(amount),
      reference:   reference.trim()   || null,
      notes:       notes.trim()       || null,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Add Tax Entry</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Amount (TT$) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
              {TAX_CATS.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="e.g. Q1 VAT filing, Monthly BIR…" />
          </div>
          <div>
            <label className={labelCls}>Reference #</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className={inputCls} placeholder="BIR ref, receipt number…" />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
          </div>
          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Add Entry'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
