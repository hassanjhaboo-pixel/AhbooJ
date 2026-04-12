'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import {
  calcBatchCost, calcCostPerUnit, calcMargin,
  calcMinPrice, suggestDirectPrice, suggestCafePrice,
  scaleIngredients, marginStatus, marginStatusLabel, marginStatusVariant,
  MARGIN_RULES,
} from '@/lib/pricing'
import { formatTTD, formatPercent } from '@/lib/formatting'
import { MarginIndicator } from '@/components/ui/MarginIndicator'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface IngredientInput {
  id: string
  name: string
  unit: string
  quantity: number
  cost_per_unit: number
  notes: string | null
}

interface RecipeScalerProps {
  baseYield: number
  yieldUnitLabel: string
  ingredients: IngredientInput[]
  existingDirectPrice?: number | null
  existingCafePrice?: number | null
}

export function RecipeScaler({
  baseYield,
  yieldUnitLabel,
  ingredients,
  existingDirectPrice,
  existingCafePrice,
}: RecipeScalerProps) {
  const [batchCount, setBatchCount] = useState(1)

  const scaled       = scaleIngredients(ingredients, batchCount)
  const batchCost    = calcBatchCost(ingredients)          // per base batch
  const totalCost    = batchCost * batchCount
  const costPerUnit  = calcCostPerUnit(batchCost, baseYield)
  const totalUnits   = baseYield * batchCount

  const suggestedDirect = suggestDirectPrice(costPerUnit)
  const suggestedCafe   = suggestCafePrice(costPerUnit)

  const directPrice  = existingDirectPrice ?? suggestedDirect
  const cafePrice    = existingCafePrice   ?? suggestedCafe

  const directMargin = calcMargin(directPrice, costPerUnit)
  const cafeMargin   = calcMargin(cafePrice,   costPerUnit)

  const directStatus = marginStatus(directMargin, 'direct')
  const cafeStatus   = marginStatus(cafeMargin,   'cafe')

  // Minimum prices at floor margins
  const minDirect = calcMinPrice(costPerUnit, MARGIN_RULES.direct_floor)
  const minCafe   = calcMinPrice(costPerUnit, MARGIN_RULES.cafe_floor)

  return (
    <div className="space-y-5">

      {/* ── Batch scaler ─────────────────── */}
      <div className="bg-espresso rounded-card p-5 text-cream">
        <p className="text-xs font-medium text-cream/60 uppercase tracking-wider mb-3">
          Production Calculator
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBatchCount(b => Math.max(1, b - 1))}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Decrease batches"
            >
              <Minus size={16} />
            </button>
            <div className="text-center">
              <span className="font-display text-3xl font-semibold">{batchCount}</span>
              <p className="text-xs text-cream/60">batch{batchCount !== 1 ? 'es' : ''}</p>
            </div>
            <button
              onClick={() => setBatchCount(b => b + 1)}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Increase batches"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="text-right">
            <p className="font-display text-2xl font-semibold">{totalUnits} units</p>
            <p className="text-xs text-cream/60">{totalUnits} × {yieldUnitLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-cream/60">Total batch cost</p>
            <p className="font-semibold text-lg">{formatTTD(totalCost)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cream/60">Cost per unit</p>
            <p className="font-semibold text-lg text-gold">{formatTTD(costPerUnit)}</p>
          </div>
        </div>
      </div>

      {/* ── Ingredient table ─────────────── */}
      {scaled.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            Scaled Ingredients{batchCount > 1 ? ` (×${batchCount})` : ''}
          </p>
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">Ingredient</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                    {batchCount === 1 ? 'Qty' : `Base → ×${batchCount}`}
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">Unit Cost</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {scaled.map(ing => (
                  <tr key={ing.id} className="hover:bg-espresso/5 transition-colors">
                    <td className="px-4 py-3 text-espresso">{ing.name}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-espresso">
                      {batchCount === 1 ? (
                        <>{ing.baseQty} {ing.unit}</>
                      ) : (
                        <span className="text-muted">
                          {ing.baseQty}{ing.unit} →{' '}
                          <span className="font-medium text-espresso">{ing.scaledQty}{ing.unit}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted">
                      {formatTTD(ing.costPerUnit)}/{ing.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                      {formatTTD(ing.lineCost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-espresso/5 border-t-2 border-espresso/10">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-espresso">
                    {batchCount > 1 ? `Total (${batchCount} batches)` : 'Batch total'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-espresso">
                    {formatTTD(totalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pricing analysis ─────────────── */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
          Pricing Analysis
          {existingDirectPrice && <span className="ml-2 text-muted normal-case font-normal">(using existing prices)</span>}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Direct price */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Direct Sale</span>
              <Badge variant={marginStatusVariant(directStatus)}>
                {marginStatusLabel(directStatus)}
              </Badge>
            </div>
            <p className="font-display text-2xl font-semibold text-espresso mb-1">
              {formatTTD(directPrice)}
            </p>
            <p className="text-xs text-muted mb-3">
              {existingDirectPrice ? 'Current price' : `Suggested (${MARGIN_RULES.direct_floor}% floor, rounded to $5)`}
            </p>
            <MarginIndicator margin={directMargin} channel="direct" showBar />
            <p className="text-xs text-muted mt-3">
              Min at {MARGIN_RULES.direct_floor}%: <span className="font-medium text-espresso">{formatTTD(minDirect)}</span>
              {directPrice > suggestedDirect && (
                <span className="text-status-green ml-1">✓ above floor</span>
              )}
            </p>
          </div>

          {/* Café price */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Café / Wholesale</span>
              <Badge variant={marginStatusVariant(cafeStatus)}>
                {marginStatusLabel(cafeStatus)}
              </Badge>
            </div>
            <p className="font-display text-2xl font-semibold text-espresso mb-1">
              {formatTTD(cafePrice)}
            </p>
            <p className="text-xs text-muted mb-3">
              {existingCafePrice ? 'Current price' : `Suggested (${MARGIN_RULES.cafe_floor}% floor, rounded to $5)`}
            </p>
            <MarginIndicator margin={cafeMargin} channel="cafe" showBar />
            <p className="text-xs text-muted mt-3">
              Min at {MARGIN_RULES.cafe_floor}%: <span className="font-medium text-espresso">{formatTTD(minCafe)}</span>
              {cafePrice > suggestedCafe && (
                <span className="text-status-green ml-1">✓ above floor</span>
              )}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {(directStatus === 'danger' || cafeStatus === 'danger') && (
          <div className="mt-3 bg-status-red/10 border border-status-red/20 rounded-lg p-3 text-sm text-status-red">
            {directStatus === 'danger' && (
              <p>⚠ Direct price below {MARGIN_RULES.direct_floor}% floor — increase to at least {formatTTD(minDirect)}</p>
            )}
            {cafeStatus === 'danger' && (
              <p>⚠ Café price below {MARGIN_RULES.cafe_floor}% floor — unsustainable at scale</p>
            )}
          </div>
        )}
        {directStatus === 'warning' && (
          <div className="mt-3 bg-status-amber/10 border border-status-amber/20 rounded-lg p-3 text-sm text-amber-700">
            <p>Monitor: direct margin below {MARGIN_RULES.direct_floor}% target — consider repricing</p>
          </div>
        )}
      </div>
    </div>
  )
}
