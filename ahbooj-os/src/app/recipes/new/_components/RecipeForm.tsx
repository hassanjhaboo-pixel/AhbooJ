'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calcBatchCost, calcCostPerUnit, suggestDirectPrice, suggestCafePrice } from '@/lib/pricing'
import { formatTTD } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface IngredientOption {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  category: string | null
}

interface IngredientRow {
  key: number
  ingredient_id: string
  quantity: string
  unit: string
  notes: string
}

const CATEGORIES = [
  { value: 'panna_cotta', label: 'Panna Cotta' },
  { value: 'truffle',     label: 'Truffle' },
  { value: 'bar',         label: 'Bar' },
  { value: 'concentrate', label: 'Concentrate' },
  { value: 'syrup',       label: 'Syrup' },
]

export function RecipeForm({ ingredients }: { ingredients: IngredientOption[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [name,           setName]           = useState('')
  const [category,       setCategory]       = useState('')
  const [yieldUnits,     setYieldUnits]     = useState('')
  const [yieldLabel,     setYieldLabel]     = useState('')
  const [instructions,   setInstructions]   = useState('')
  const [notes,          setNotes]          = useState('')
  const [rows,           setRows]           = useState<IngredientRow[]>([{ key: 0, ingredient_id: '', quantity: '', unit: '', notes: '' }])
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  let nextKey = rows.length

  function addRow() {
    setRows(r => [...r, { key: nextKey++, ingredient_id: '', quantity: '', unit: '', notes: '' }])
  }

  function removeRow(key: number) {
    setRows(r => r.filter(row => row.key !== key))
  }

  function updateRow(key: number, field: keyof IngredientRow, value: string) {
    setRows(r => r.map(row => {
      if (row.key !== key) return row
      const updated = { ...row, [field]: value }
      // Auto-fill unit when ingredient is selected
      if (field === 'ingredient_id' && value) {
        const ing = ingredients.find(i => i.id === value)
        if (ing) updated.unit = ing.unit
      }
      return updated
    }))
  }

  // Live cost preview
  const costPreview = (() => {
    const filled = rows.filter(r => r.ingredient_id && r.quantity)
    if (filled.length === 0 || !yieldUnits || parseFloat(yieldUnits) <= 0) return null
    const ings = filled.map(r => {
      const ing = ingredients.find(i => i.id === r.ingredient_id)
      return { quantity: parseFloat(r.quantity) || 0, cost_per_unit: ing?.cost_per_unit ?? 0 }
    })
    const batchCost   = calcBatchCost(ings)
    const costPerUnit = calcCostPerUnit(batchCost, parseFloat(yieldUnits))
    return { batchCost, costPerUnit, directPrice: suggestDirectPrice(costPerUnit), cafePrice: suggestCafePrice(costPerUnit) }
  })()

  async function handleSave() {
    setError(null)
    if (!name.trim()) { setError('Recipe name is required.'); return }
    if (!yieldUnits || parseFloat(yieldUnits) <= 0) { setError('Yield units must be a positive number.'); return }
    if (!yieldLabel.trim()) { setError('Yield unit label is required (e.g. "6oz jar").'); return }

    const validRows = rows.filter(r => r.ingredient_id && r.quantity && parseFloat(r.quantity) > 0)

    setSaving(true)
    try {
      // 1. Insert recipe
      const { data: recipe, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          name:             name.trim(),
          category:         category || null,
          base_yield_units: parseInt(yieldUnits),
          yield_unit_label: yieldLabel.trim(),
          instructions:     instructions.trim() || null,
          notes:            notes.trim() || null,
        })
        .select('id')
        .single()

      if (recipeErr || !recipe) throw new Error(recipeErr?.message ?? 'Failed to create recipe')

      // 2. Insert ingredients
      if (validRows.length > 0) {
        const { error: ingErr } = await supabase
          .from('recipe_ingredients')
          .insert(validRows.map(r => ({
            recipe_id:     recipe.id,
            ingredient_id: r.ingredient_id,
            quantity:      parseFloat(r.quantity),
            unit:          r.unit,
            notes:         r.notes.trim() || null,
          })))

        if (ingErr) throw new Error(ingErr.message)
      }

      router.push(`/recipes/${recipe.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-espresso/20 bg-warm-white text-espresso text-sm placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors'
  const labelClass = 'block text-xs font-medium text-muted uppercase tracking-wider mb-1.5'

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Recipe details */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-6 space-y-5">
        <h3 className="font-display font-semibold text-espresso">Recipe Details</h3>

        <div>
          <label className={labelClass}>Recipe Name *</label>
          <input
            className={inputClass}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Vanilla Panna Cotta"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Yield (units) *</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={yieldUnits}
                onChange={e => setYieldUnits(e.target.value)}
                placeholder="8"
              />
            </div>
            <div>
              <label className={labelClass}>Unit label *</label>
              <input
                className={inputClass}
                value={yieldLabel}
                onChange={e => setYieldLabel(e.target.value)}
                placeholder="6oz jar"
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Instructions</label>
          <textarea
            className={cn(inputClass, 'min-h-[100px] resize-y')}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Step-by-step production instructions…"
          />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            className={cn(inputClass, 'min-h-[64px] resize-y')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Storage tips, variations, sourcing notes…"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-espresso">Ingredients</h3>
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta/80 font-medium cursor-pointer"
          >
            <Plus size={15} />Add ingredient
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, idx) => {
            const selectedIng = ingredients.find(i => i.id === row.ingredient_id)
            return (
              <div key={row.key} className="grid grid-cols-12 gap-2 items-start">
                {/* Ingredient select */}
                <div className="col-span-5">
                  {idx === 0 && <label className={labelClass}>Ingredient</label>}
                  <select
                    className={inputClass}
                    value={row.ingredient_id}
                    onChange={e => updateRow(row.key, 'ingredient_id', e.target.value)}
                  >
                    <option value="">Select…</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  {idx === 0 && <label className={labelClass}>Qty</label>}
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={row.quantity}
                    onChange={e => updateRow(row.key, 'quantity', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Unit */}
                <div className="col-span-2">
                  {idx === 0 && <label className={labelClass}>Unit</label>}
                  <input
                    className={inputClass}
                    value={row.unit}
                    onChange={e => updateRow(row.key, 'unit', e.target.value)}
                    placeholder={selectedIng?.unit ?? 'g'}
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  {idx === 0 && <label className={labelClass}>Notes</label>}
                  <input
                    className={inputClass}
                    value={row.notes}
                    onChange={e => updateRow(row.key, 'notes', e.target.value)}
                    placeholder="optional"
                  />
                </div>

                {/* Remove */}
                <div className={cn('col-span-1 flex justify-center', idx === 0 && 'mt-6')}>
                  <button
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1}
                    className="p-2 rounded-lg text-muted hover:text-status-red hover:bg-status-red/10 transition-colors disabled:opacity-30 cursor-pointer"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Live cost preview */}
        {costPreview && (
          <div className="mt-5 pt-4 border-t border-espresso/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-warm-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">Batch Cost</p>
              <p className="font-semibold text-espresso">{formatTTD(costPreview.batchCost)}</p>
            </div>
            <div className="bg-warm-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">Cost / Unit</p>
              <p className="font-semibold text-espresso">{formatTTD(costPreview.costPerUnit)}</p>
            </div>
            <div className="bg-warm-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">Direct min</p>
              <p className="font-semibold text-terracotta">{formatTTD(costPreview.directPrice)}</p>
            </div>
            <div className="bg-warm-white rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">Café min</p>
              <p className="font-semibold text-gold">{formatTTD(costPreview.cafePrice)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-status-red/10 border border-status-red/30 rounded-lg p-4 text-sm text-status-red">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Saving…' : 'Save Recipe'}
        </Button>
        <button
          onClick={() => router.push('/recipes')}
          className="text-sm text-muted hover:text-espresso cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
