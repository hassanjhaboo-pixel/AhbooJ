'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  unit: string
  stock_on_hand: number
}

interface StockAdjustModalProps {
  ingredient: Ingredient
  onClose: () => void
}

export function StockAdjustModal({ ingredient, onClose }: StockAdjustModalProps) {
  const router = useRouter()
  const [newStock, setNewStock] = useState(ingredient.stock_on_hand.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const newStockNum = parseFloat(newStock)
  const delta = !isNaN(newStockNum) ? newStockNum - ingredient.stock_on_hand : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isNaN(newStockNum) || newStockNum < 0) return

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: updateErr } = await supabase
      .from('ingredients')
      .update({ stock_on_hand: newStockNum })
      .eq('id', ingredient.id)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <div>
            <h3 className="font-display font-semibold text-espresso">Adjust Stock</h3>
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted">
                Stock on Hand ({ingredient.unit})
              </label>
              {delta !== null && delta !== 0 && (
                <span className={`text-xs font-semibold ${delta > 0 ? 'text-status-green' : 'text-status-red'}`}>
                  {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} {ingredient.unit}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-muted">
                Current:{' '}
                <span className="font-medium text-espresso">
                  {ingredient.stock_on_hand} {ingredient.unit}
                </span>
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              className="w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40"
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
              {saving ? 'Saving…' : 'Update Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
