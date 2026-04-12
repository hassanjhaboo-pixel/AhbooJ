'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTTD } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'

interface RecipeOption {
  id: string
  name: string
  base_yield_units: number
  single_batch_cost: number
}

interface LogBatchModalProps {
  recipes: RecipeOption[]
  onClose: () => void
}

function genBatchNumber(): string {
  const d = new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `BATCH-${ymd}-${rand}`
}

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function LogBatchModal({ recipes, onClose }: LogBatchModalProps) {
  const router = useRouter()

  const [recipeId,      setRecipeId]      = useState('')
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0])
  const [plannedYield,  setPlannedYield]  = useState('')
  const [actualYield,   setActualYield]   = useState('')
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  const selectedRecipe = recipes.find(r => r.id === recipeId)
  const plannedNum     = parseInt(plannedYield) || 0

  // Compute estimated batch cost: single_batch_cost × (planned_yield / base_yield_units)
  const estimatedBatchCost = selectedRecipe && plannedNum > 0
    ? selectedRecipe.single_batch_cost * (plannedNum / selectedRecipe.base_yield_units)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeId || !plannedNum) return

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: insertErr } = await supabase
      .from('production_batches')
      .insert({
        batch_number:    genBatchNumber(),
        recipe_id:       recipeId,
        production_date: productionDate,
        planned_yield:   plannedNum,
        actual_yield:    parseInt(actualYield) || null,
        batch_cost:      estimatedBatchCost ?? null,
        produced_by:     'Hassan',
        notes:           notes.trim() || null,
      })

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Log Production Batch</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Recipe *</label>
            <select required value={recipeId} onChange={e => setRecipeId(e.target.value)} className={inputCls}>
              <option value="">— Select recipe —</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Production Date</label>
              <input type="date" value={productionDate} onChange={e => setProductionDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>
                Planned Yield
                {selectedRecipe && <span className="ml-1 text-espresso/50">({selectedRecipe.base_yield_units}/batch)</span>}
              </label>
              <input
                type="number" min="1" step="1" required
                value={plannedYield} onChange={e => setPlannedYield(e.target.value)}
                className={inputCls} placeholder="units"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Actual Yield (if already produced)</label>
            <input
              type="number" min="0" step="1"
              value={actualYield} onChange={e => setActualYield(e.target.value)}
              className={inputCls} placeholder="leave blank if not yet produced"
            />
          </div>

          {estimatedBatchCost !== null && (
            <div className="bg-terracotta/10 rounded-lg p-3 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-muted">Est. Batch Cost</p>
                <p className="font-display text-lg font-semibold text-terracotta">{formatTTD(estimatedBatchCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Est. Cost / Unit</p>
                <p className="font-display text-lg font-semibold text-espresso">
                  {formatTTD(estimatedBatchCost / plannedNum)}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="e.g. double batch, new supplier vanilla" />
          </div>

          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Log Batch'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
