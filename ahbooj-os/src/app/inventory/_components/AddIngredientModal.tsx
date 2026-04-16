'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const CATEGORIES = ['panna_cotta', 'lemon_bar', 'truffle', 'shared', 'chai', 'packaging']
const UNITS = ['g', 'ml', 'unit', 'pack', 'kg', 'L']

export function AddIngredientModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: 'shared',
    unit: 'g',
    cost_per_unit: '',
    stock_on_hand: '0',
    low_stock_threshold: '0',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    if (!form.name.trim()) { setErr('Name is required'); return }
    if (!form.cost_per_unit || isNaN(Number(form.cost_per_unit))) { setErr('Valid cost per unit is required'); return }
    setSaving(true); setErr('')
    const { error } = await supabase.from('ingredients').insert({
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      cost_per_unit: Number(form.cost_per_unit),
      stock_on_hand: Number(form.stock_on_hand) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      notes: form.notes.trim() || null,
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
          <h2 className="font-display font-semibold text-espresso text-lg">New Ingredient</h2>
          <button onClick={onClose} className="text-muted hover:text-espresso text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Heavy Cream"
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Cost per {form.unit} (TT$) *</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={form.cost_per_unit}
              onChange={e => set('cost_per_unit', e.target.value)}
              placeholder="0.0000"
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Stock on Hand ({form.unit})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.stock_on_hand}
                onChange={e => set('stock_on_hand', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Low Stock Alert ({form.unit})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.low_stock_threshold}
                onChange={e => set('low_stock_threshold', e.target.value)}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
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
            {saving ? 'Saving…' : 'Add Ingredient'}
          </Button>
        </div>
      </div>
    </div>
  )
}
