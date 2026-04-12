'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  calcMargin, marginStatus, marginStatusVariant,
  suggestDirectPrice, suggestCafePrice, MARGIN_RULES,
} from '@/lib/pricing'
import { formatTTD, formatPercent } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  tier: string | null
  recipe_id: string | null
  direct_price: number | null
  cafe_price: number | null
  cost_per_unit: number | null
  is_active: boolean
  channel: string
  notes: string | null
}

interface RecipeOption {
  id: string
  name: string
  costPerUnit: number
}

const CATEGORIES = [
  'panna_cotta', 'truffle', 'lemon_bar', 'concentrate', 'syrup', 'gifting',
]
const TIERS = ['standard', 'premium', 'seasonal', 'gifting']
const CHANNELS = [
  { value: 'both',   label: 'Direct + Café' },
  { value: 'direct', label: 'Direct Only' },
  { value: 'cafe',   label: 'Café Only' },
]

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-warm-white px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

function MarginPreview({ margin, channel }: { margin: number | null; channel: 'direct' | 'cafe' }) {
  if (margin === null) return null
  const status = marginStatus(margin, channel)
  const floor  = channel === 'direct' ? MARGIN_RULES.direct_floor : MARGIN_RULES.cafe_floor
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Badge variant={marginStatusVariant(status)}>{formatPercent(margin, 0)} margin</Badge>
      {margin < floor && (
        <span className="text-xs text-status-red">Below {floor}% floor</span>
      )}
    </div>
  )
}

export function ProductEditForm({
  product,
  recipes,
}: {
  product: Product
  recipes: RecipeOption[]
}) {
  const router = useRouter()

  const [name,        setName]        = useState(product.name)
  const [sku,         setSku]         = useState(product.sku ?? '')
  const [category,    setCategory]    = useState(product.category ?? '')
  const [tier,        setTier]        = useState(product.tier ?? '')
  const [recipeId,    setRecipeId]    = useState(product.recipe_id ?? '')
  const [costInput,   setCostInput]   = useState(product.cost_per_unit?.toString() ?? '')
  const [directPrice, setDirectPrice] = useState(product.direct_price?.toString() ?? '')
  const [cafePrice,   setCafePrice]   = useState(product.cafe_price?.toString() ?? '')
  const [channel,     setChannel]     = useState(product.channel)
  const [isActive,    setIsActive]    = useState(product.is_active)
  const [notes,       setNotes]       = useState(product.notes ?? '')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const selectedRecipe = recipes.find(r => r.id === recipeId)
  const effectiveCost  = selectedRecipe
    ? selectedRecipe.costPerUnit
    : (parseFloat(costInput) || 0)

  const directNum    = parseFloat(directPrice) || 0
  const cafeNum      = parseFloat(cafePrice)   || 0
  const directMargin = directNum > 0 && effectiveCost > 0 ? calcMargin(directNum, effectiveCost) : null
  const cafeMargin   = cafeNum   > 0 && effectiveCost > 0 ? calcMargin(cafeNum,   effectiveCost) : null

  function handleRecipeChange(id: string) {
    setRecipeId(id)
    const rec = recipes.find(r => r.id === id)
    if (rec && rec.costPerUnit > 0) {
      setDirectPrice(suggestDirectPrice(rec.costPerUnit).toString())
      setCafePrice(suggestCafePrice(rec.costPerUnit).toString())
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('products')
      .update({
        name:          name.trim(),
        sku:           sku.trim() || null,
        category:      category || null,
        tier:          tier || null,
        recipe_id:     recipeId || null,
        cost_per_unit: effectiveCost > 0 ? effectiveCost : null,
        direct_price:  directNum > 0 ? directNum : null,
        cafe_price:    cafeNum   > 0 ? cafeNum   : null,
        channel,
        is_active:     isActive,
        notes:         notes.trim() || null,
      })
      .eq('id', product.id)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Details */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Product Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>SKU</label>
            <input type="text" value={sku} onChange={e => setSku(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} className={inputCls}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tier</label>
            <select value={tier} onChange={e => setTier(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Active toggle */}
          <div className="col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                isActive ? 'bg-status-green' : 'bg-espresso/20'
              )}
            >
              <span className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                isActive ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
            <span className="text-sm text-espresso">{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Costing */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Costing</h3>
        <div>
          <label className={labelCls}>Recipe</label>
          <select value={recipeId} onChange={e => handleRecipeChange(e.target.value)} className={inputCls}>
            <option value="">— No recipe / manual cost —</option>
            {recipes.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.costPerUnit > 0 ? `${formatTTD(r.costPerUnit)}/unit` : 'no cost data'}
              </option>
            ))}
          </select>
        </div>
        {!recipeId && (
          <div>
            <label className={labelCls}>Cost per Unit (TT$)</label>
            <input
              type="number" step="0.01" min="0"
              value={costInput} onChange={e => setCostInput(e.target.value)}
              className={inputCls} placeholder="0.00"
            />
          </div>
        )}
        {selectedRecipe && (
          <div className="bg-espresso/5 rounded-lg px-3 py-2 text-xs text-muted">
            Cost from recipe:{' '}
            <span className="font-semibold text-espresso">{formatTTD(selectedRecipe.costPerUnit)} / unit</span>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Direct Sale Price (TT$)</label>
            <input
              type="number" step="0.01" min="0"
              value={directPrice} onChange={e => setDirectPrice(e.target.value)}
              className={inputCls} placeholder="0.00"
            />
            <MarginPreview margin={directMargin} channel="direct" />
          </div>
          <div>
            <label className={labelCls}>Café / Wholesale Price (TT$)</label>
            <input
              type="number" step="0.01" min="0"
              value={cafePrice} onChange={e => setCafePrice(e.target.value)}
              className={inputCls} placeholder="0.00"
            />
            <MarginPreview margin={cafeMargin} channel="cafe" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <label className={labelCls}>Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={2}
          className={cn(inputCls, 'resize-none')}
        />
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-status-green/10 border border-status-green/30 rounded-lg p-3 text-sm text-status-green">
          Changes saved.
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push('/products')}>
          Back to Products
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
