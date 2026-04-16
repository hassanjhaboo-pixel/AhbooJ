'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Calculator } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTTD } from '@/lib/formatting'
import { cn } from '@/lib/utils'

type RecipeIngredient = {
  id: string
  quantity: number
  unit: string
  ingredient: {
    id: string
    name: string
    unit: string
    cost_per_unit: number
  } | null
}

type IngredientOption = {
  id: string
  name: string
  unit: string
  cost_per_unit: number
}

type RecipeInfo = {
  id: string
  base_yield_units: number
}

export function LiveCostingPanel({
  recipeIngredients,
  allIngredients,
  recipe,
}: {
  recipeIngredients: RecipeIngredient[]
  allIngredients: IngredientOption[]
  recipe: RecipeInfo
}) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<RecipeIngredient[]>(recipeIngredients)
  const [multiplier, setMultiplier] = useState(1)
  const [adding, setAdding] = useState(false)
  const [newIngId, setNewIngId] = useState('')
  const [newQty, setNewQty] = useState('')
  const [saving, setSaving] = useState(false)

  const totalCost = items.reduce((sum, ri) => {
    if (!ri.ingredient) return sum
    return sum + ri.quantity * ri.ingredient.cost_per_unit * multiplier
  }, 0)

  const costPerUnit = recipe.base_yield_units > 0
    ? totalCost / (recipe.base_yield_units * multiplier)
    : 0

  const suggestedDirect = costPerUnit > 0 ? costPerUnit / (1 - 0.55) : 0
  const suggestedCafe   = costPerUnit > 0 ? costPerUnit / (1 - 0.35) : 0

  async function removeIngredient(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('recipe_ingredients').delete().eq('id', id)
    router.refresh()
  }

  async function addIngredient() {
    if (!newIngId || !newQty) return
    const ing = allIngredients.find(i => i.id === newIngId)
    if (!ing) return
    setSaving(true)
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .insert({
        recipe_id: recipe.id,
        ingredient_id: newIngId,
        quantity: Number(newQty),
        unit: ing.unit,
      })
      .select('id, quantity, unit')
      .single()
    setSaving(false)
    if (!error && data) {
      setItems(prev => [...prev, {
        id: data.id,
        quantity: data.quantity,
        unit: data.unit,
        ingredient: ing,
      }])
      setNewIngId('')
      setNewQty('')
      setAdding(false)
      router.refresh()
    }
  }

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-terracotta" />
          <h3 className="font-display font-semibold text-espresso text-sm">Live Costing</h3>
        </div>
        {/* Batch multiplier */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Batches:</span>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setMultiplier(n)}
              className={cn(
                'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                multiplier === n ? 'bg-terracotta text-white' : 'bg-espresso/10 text-espresso hover:bg-espresso/20'
              )}
            >
              {n}×
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient list */}
      <div className="divide-y divide-espresso/5">
        {items.map(ri => {
          const lineCost = ri.ingredient
            ? ri.quantity * ri.ingredient.cost_per_unit * multiplier
            : 0
          return (
            <div key={ri.id} className="flex items-center gap-3 px-5 py-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-espresso truncate">
                  {ri.ingredient?.name ?? '—'}
                </p>
                <p className="text-xs text-muted">
                  {(ri.quantity * multiplier).toFixed(2)} {ri.unit}
                  {ri.ingredient && (
                    <> · {formatTTD(ri.ingredient.cost_per_unit)}/{ri.ingredient.unit}</>
                  )}
                </p>
              </div>
              <span className="text-sm font-medium text-espresso tabular-nums">{formatTTD(lineCost)}</span>
              <button
                onClick={() => removeIngredient(ri.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add ingredient inline */}
      {adding ? (
        <div className="px-5 py-3 border-t border-espresso/10 flex items-center gap-2">
          <select
            value={newIngId}
            onChange={e => setNewIngId(e.target.value)}
            className="flex-1 border border-espresso/20 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="">Select ingredient…</option>
            {allIngredients.map(i => (
              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            placeholder="Qty"
            className="w-20 border border-espresso/20 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          />
          <button
            onClick={addIngredient}
            disabled={saving}
            className="px-3 py-1.5 bg-terracotta text-white rounded-lg text-xs font-medium hover:bg-terracotta/90 disabled:opacity-50"
          >
            {saving ? '…' : 'Add'}
          </button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted hover:text-espresso">
            Cancel
          </button>
        </div>
      ) : (
        <div className="px-5 py-3 border-t border-espresso/10">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-terracotta transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add ingredient
          </button>
        </div>
      )}

      {/* Cost summary */}
      <div className="border-t-2 border-espresso/10 bg-espresso/[0.03] px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total batch cost ({multiplier}×)</span>
          <span className="font-semibold text-espresso">{formatTTD(totalCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Cost per unit</span>
          <span className="font-semibold text-espresso">{formatTTD(costPerUnit)}</span>
        </div>
        <div className="border-t border-espresso/10 pt-2 space-y-1">
          <p className="text-xs font-medium text-espresso mb-1">Suggested Prices (at margin floors)</p>
          <div className="flex justify-between text-xs text-muted">
            <span>Direct (55% margin)</span>
            <span className="font-medium text-espresso">{formatTTD(suggestedDirect)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Café (35% margin)</span>
            <span className="font-medium text-espresso">{formatTTD(suggestedCafe)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
