'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { formatTTD, formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'

type WastageEntry = {
  id: string
  waste_date: string
  quantity_wasted: number
  unit: string
  estimated_cost: number | null
  reason: string | null
  notes: string | null
  ingredients: { name: string }[] | null
  production_batches: { batch_number: string | null } | null
}

type Ingredient = { id: string; name: string; unit: string; cost_per_unit: number }
type Batch = { id: string; batch_number: string | null }

const REASONS = [
  { value: 'over_production', label: 'Over Production' },
  { value: 'spoilage',        label: 'Spoilage' },
  { value: 'qc_fail',         label: 'QC Fail' },
  { value: 'spillage',        label: 'Spillage' },
  { value: 'other',           label: 'Other' },
]

function LogModal({
  ingredients,
  batches,
  onClose,
}: {
  ingredients: Ingredient[]
  batches: Batch[]
  onClose: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    ingredient_id: '',
    batch_id: '',
    waste_date: new Date().toISOString().split('T')[0],
    quantity_wasted: '',
    unit: 'g',
    reason: 'spoilage',
    notes: '',
  })

  const selectedIngredient = ingredients.find(i => i.id === form.ingredient_id)

  function set(field: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'ingredient_id') {
        const ing = ingredients.find(i => i.id === value)
        if (ing) next.unit = ing.unit
      }
      return next
    })
  }

  async function save() {
    if (!form.ingredient_id) { setErr('Select an ingredient'); return }
    if (!form.quantity_wasted || isNaN(Number(form.quantity_wasted))) { setErr('Enter a quantity'); return }
    setSaving(true); setErr('')
    const qty = Number(form.quantity_wasted)
    const estCost = selectedIngredient ? qty * selectedIngredient.cost_per_unit : null
    const { error } = await supabase.from('wastage_log').insert({
      ingredient_id:  form.ingredient_id || null,
      batch_id:       form.batch_id || null,
      waste_date:     form.waste_date,
      quantity_wasted: qty,
      unit:           form.unit,
      estimated_cost: estCost,
      reason:         form.reason,
      notes:          form.notes.trim() || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-espresso/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-espresso text-lg">Log Wastage</h2>
          <button onClick={onClose} className="text-muted hover:text-espresso text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Ingredient *</label>
            <select
              value={form.ingredient_id}
              onChange={e => set('ingredient_id', e.target.value)}
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Select ingredient…</option>
              {ingredients.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Quantity Wasted *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.quantity_wasted}
                onChange={e => set('quantity_wasted', e.target.value)}
                placeholder="0"
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          {selectedIngredient && form.quantity_wasted && (
            <p className="text-xs text-muted bg-espresso/5 rounded-lg px-3 py-2">
              Estimated cost: <span className="font-semibold text-espresso">
                {formatTTD(Number(form.quantity_wasted) * selectedIngredient.cost_per_unit)}
              </span>
            </p>
          )}
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Linked Batch</label>
            <select
              value={form.batch_id}
              onChange={e => set('batch_id', e.target.value)}
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">None</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batch_number ?? b.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Date</label>
              <input
                type="date"
                value={form.waste_date}
                onChange={e => set('waste_date', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Reason</label>
              <select
                value={form.reason}
                onChange={e => set('reason', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </div>
          {err && <p className="text-red-600 text-xs">{err}</p>}
        </div>
        <div className="px-6 py-4 border-t border-espresso/10 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Log Wastage'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const REASON_LABEL: Record<string, string> = {
  over_production: 'Over Production',
  spoilage: 'Spoilage',
  qc_fail: 'QC Fail',
  spillage: 'Spillage',
  other: 'Other',
}

export function WastageClient({
  entries,
  ingredients,
  batches,
}: {
  entries: WastageEntry[]
  ingredients: Ingredient[]
  batches: Batch[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const totalCost = entries.reduce((s, e) => s + (e.estimated_cost ?? 0), 0)

  async function handleDelete(id: string) {
    if (!confirm('Delete this wastage entry?')) return
    setDeleting(id)
    await supabase.from('wastage_log').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted">{entries.length} entries logged</p>
          {totalCost > 0 && (
            <p className="text-xs text-muted mt-0.5">
              Total estimated waste cost: <span className="font-semibold text-espresso">{formatTTD(totalCost)}</span>
            </p>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Log Wastage
        </Button>
      </div>

      <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted">No wastage logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Ingredient</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Quantity</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Reason</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Est. Cost</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-espresso/5 transition-colors">
                    <td className="px-5 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                      {formatDate(entry.waste_date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 font-medium text-espresso">
                      {entry.ingredients?.[0]?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">
                      {entry.quantity_wasted} {entry.unit}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        entry.reason === 'qc_fail' ? 'bg-red-100 text-red-700' :
                        entry.reason === 'spoilage' ? 'bg-orange-100 text-orange-700' :
                        'bg-espresso/10 text-espresso'
                      )}>
                        {REASON_LABEL[entry.reason ?? 'other'] ?? entry.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {entry.estimated_cost
                        ? <span className="font-medium text-espresso">{formatTTD(entry.estimated_cost)}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">
                      {entry.production_batches?.batch_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="p-1.5 rounded text-muted hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <LogModal
          ingredients={ingredients}
          batches={batches}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
