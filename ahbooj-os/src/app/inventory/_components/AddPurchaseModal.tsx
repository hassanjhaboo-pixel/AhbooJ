'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTTD } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  unit: string
  stock_on_hand: number
  cost_per_unit: number
}

interface AddPurchaseModalProps {
  ingredient: Ingredient
  onClose: () => void
}

export function AddPurchaseModal({ ingredient, onClose }: AddPurchaseModalProps) {
  const router = useRouter()
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const qtyNum = parseFloat(qty)
  const priceNum = parseFloat(price)
  const costPreview = qtyNum > 0 && priceNum > 0 ? priceNum / qtyNum : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!qtyNum || !priceNum) return

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: insertErr } = await supabase
      .from('ingredient_purchases')
      .insert({
        ingredient_id: ingredient.id,
        quantity_purchased: qtyNum,
        unit: ingredient.unit,
        total_price_paid: priceNum,
        purchase_date: date,
        notes: notes || null,
      })

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    // Update ingredient: new cost_per_unit + add quantity to stock_on_hand
    const newCost = priceNum / qtyNum
    const { error: updateErr } = await supabase
      .from('ingredients')
      .update({
        cost_per_unit: newCost,
        stock_on_hand: ingredient.stock_on_hand + qtyNum,
      })
      .eq('id', ingredient.id)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    // Fire ingredient-purchase event (handles ledger, propagate-cost, alerts, restocking)
    try {
      const res = await fetch('/api/events/ingredient-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId:   ingredient.id,
          ingredientName: ingredient.name,
          qty:            qtyNum,
          totalPrice:     priceNum,
          purchaseDate:   date,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[AddPurchaseModal] ingredient-purchase event failed:', res.status, data)
      }
    } catch (err) {
      console.error('[AddPurchaseModal] ingredient-purchase fetch error:', err)
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <div>
            <h3 className="font-display font-semibold text-espresso">Log Purchase</h3>
            <p className="text-xs text-muted mt-0.5">{ingredient.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Quantity ({ingredient.unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Total Price (TT$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                placeholder="0.00"
              />
            </div>
          </div>

          {costPreview !== null && (
            <div className="bg-terracotta/10 rounded-lg p-3 text-center">
              <p className="text-xs text-muted">New cost per {ingredient.unit}</p>
              <p className="font-display text-xl font-semibold text-terracotta">
                {formatTTD(costPreview)}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Current: {formatTTD(ingredient.cost_per_unit)} — will be updated
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Purchase Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              placeholder="e.g. Hi-Lo, bulk purchase, price drop"
            />
          </div>

          {error && (
            <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Log Purchase'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
