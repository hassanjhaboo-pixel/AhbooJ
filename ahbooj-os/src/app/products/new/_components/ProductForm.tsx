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

export function ProductForm({ recipes }: { recipes: RecipeOption[] }) {
  const router = useRouter()

  const [name,        setName]        = useState('')
  const [sku,         setSku]         = useState('')
  const [category,    setCategory]    = useState('')
  const [tier,        setTier]        = useState('')
  const [recipeId,    setRecipeId]    = useState('')
  const [costInput,   setCostInput]   = useState('')
  const [directPrice, setDirectPrice] = useState('')
  const [cafePrice,   setCafePrice]   = useState('')
  const [channel,     setChannel]     = useState('both')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)
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
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert({
        name:          name.trim(),
        sku:           sku.trim() || null,
        category:      category || null,
        tier:          tier || null,
        recipe_id:     recipeId || null,
        cost_per_unit: effectiveCost > 0 ? effectiveCost : null,
        direct_price:  directNum > 0 ? directNum : null,
        cafe_price:    cafeNum   > 0 ? cafeNum   : null,
        channel,
        notes:         notes.trim() || null,
        is_active:     true,
      })
      .select('id')
      .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

    if (insertErr || !inserted) {
      setError(insertErr?.message ?? 'Failed to create product')
      setSaving(false)
      return
    }

    // Redirect to product detail so tiers can be added immediately
    router.push(`/products/${inserted.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Identity */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Product Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Product Name *</label>
            <input
              type="text" required
              value={name} onChange={e => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Vanilla Panna Cotta 6-pack"
            />
          </div>
          <div>
            <label className={labelCls}>SKU</label>
            <input
              type="text"
              value={sku} onChange={e => setSku(e.target.value)}
              className={inputCls}
              placeholder="e.g. VPC-6PK"
            />
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
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tier</label>
            <select value={tier} onChange={e => setTier(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Costing */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Costing</h3>
        <div>
          <label className={labelCls}>Link to Recipe (auto-fills cost + suggested prices)</label>
          <select value={recipeId} onChange={e => handleRecipeChange(e.target.value)} className={inputCls}>
            <option value="">— No recipe / enter cost manually —</option>
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
          {(channel === 'direct' || channel === 'both') && (
            <div>
              <label className={labelCls}>Direct Sale Price (TT$)</label>
              <input
                type="number" step="0.01" min="0"
                value={directPrice} onChange={e => setDirectPrice(e.target.value)}
                className={inputCls} placeholder="0.00"
              />
              <MarginPreview margin={directMargin} channel="direct" />
            </div>
          )}
          {(channel === 'cafe' || channel === 'both') && (
            <div>
              <label className={labelCls}>Café / Wholesale Price (TT$)</label>
              <input
                type="number" step="0.01" min="0"
                value={cafePrice} onChange={e => setCafePrice(e.target.value)}
                className={inputCls} placeholder="0.00"
              />
              <MarginPreview margin={cafeMargin} channel="cafe" />
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={2}
          className={cn(inputCls, 'resize-none')}
          placeholder="Packaging details, size description, special instructions…"
        />
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
