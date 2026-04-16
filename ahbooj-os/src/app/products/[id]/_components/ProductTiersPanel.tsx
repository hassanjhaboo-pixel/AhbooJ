'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTTD } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

type Tier = {
  id: string
  tier_name: string
  price: number
  is_default: boolean
  notes: string | null
}

const PRESET_TIERS = ['direct', 'cafe', 'wholesale', 'event', 'gift']

export function ProductTiersPanel({
  productId,
  costPerUnit,
  initial,
}: {
  productId: string
  costPerUnit: number | null
  initial: Tier[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [tiers, setTiers] = useState<Tier[]>(initial)
  const [adding, setAdding] = useState(false)
  const [newTier, setNewTier] = useState({ tier_name: 'wholesale', price: '', is_default: false, notes: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function margin(price: number) {
    if (!costPerUnit || costPerUnit <= 0) return null
    return ((price - costPerUnit) / price) * 100
  }

  async function addTier() {
    if (!newTier.tier_name || !newTier.price) return
    setSaving(true)
    const { data, error } = await supabase.from('product_tiers').insert({
      product_id: productId,
      tier_name:  newTier.tier_name,
      price:      Number(newTier.price),
      is_default: newTier.is_default,
      notes:      newTier.notes || null,
    }).select('id, tier_name, price, is_default, notes').single()
    setSaving(false)
    if (!error && data) {
      setTiers(prev => [...prev, data as Tier])
      setAdding(false)
      setNewTier({ tier_name: 'wholesale', price: '', is_default: false, notes: '' })
      router.refresh()
    }
  }

  async function deleteTier(id: string) {
    setDeleting(id)
    await supabase.from('product_tiers').delete().eq('id', id)
    setTiers(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
    router.refresh()
  }

  async function setDefault(id: string) {
    await supabase.from('product_tiers').update({ is_default: false }).eq('product_id', productId)
    await supabase.from('product_tiers').update({ is_default: true }).eq('id', id)
    setTiers(prev => prev.map(t => ({ ...t, is_default: t.id === id })))
    router.refresh()
  }

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <h3 className="font-display font-semibold text-espresso text-sm">Price Tiers</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Tier
        </Button>
      </div>

      <div className="divide-y divide-espresso/5">
        {tiers.map(t => {
          const m = margin(t.price)
          return (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3 group">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-espresso capitalize">{t.tier_name}</span>
                  {t.is_default && (
                    <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                  )}
                </div>
                {t.notes && <p className="text-xs text-muted mt-0.5">{t.notes}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold text-espresso text-sm">{formatTTD(t.price)}</p>
                {m !== null && (
                  <p className={cn('text-xs', m >= 55 ? 'text-status-green' : m >= 35 ? 'text-amber-600' : 'text-status-red')}>
                    {m.toFixed(1)}% margin
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {!t.is_default && (
                  <button
                    onClick={() => setDefault(t.id)}
                    className="p-1.5 rounded text-muted hover:text-gold transition-colors"
                    title="Set as default"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteTier(t.id)}
                  disabled={deleting === t.id}
                  className="p-1.5 rounded text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {tiers.length === 0 && !adding && (
          <p className="px-5 py-6 text-sm text-muted text-center">No custom tiers yet. The default Direct and Café prices are used.</p>
        )}
      </div>

      {adding && (
        <div className="border-t border-espresso/10 px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Tier Name</label>
              <select
                value={newTier.tier_name}
                onChange={e => setNewTier(p => ({ ...p, tier_name: e.target.value }))}
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {PRESET_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-espresso mb-1">Price (TT$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newTier.price}
                onChange={e => setNewTier(p => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Notes</label>
            <input
              type="text"
              value={newTier.notes}
              onChange={e => setNewTier(p => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Events discount, Bulk 6+ units"
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          {newTier.price && costPerUnit && (
            <p className="text-xs text-muted">
              Margin at this price:{' '}
              <span className={cn(
                'font-semibold',
                margin(Number(newTier.price))! >= 55 ? 'text-status-green' :
                margin(Number(newTier.price))! >= 35 ? 'text-amber-600' : 'text-status-red'
              )}>
                {margin(Number(newTier.price))?.toFixed(1)}%
              </span>
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={addTier} disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
