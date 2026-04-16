'use client'

import { useState } from 'react'
import { Package, ShoppingCart, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatTTD, formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'
import { AddPurchaseModal } from './AddPurchaseModal'
import { StockAdjustModal } from './StockAdjustModal'
import { AddIngredientModal } from './AddIngredientModal'
import { ReorderPanel } from './ReorderPanel'
import { PriceHistoryTab } from './PriceHistoryTab'

interface Ingredient {
  id: string
  name: string
  category: string | null
  unit: string
  cost_per_unit: number
  stock_on_hand: number
  low_stock_threshold: number
}

interface Purchase {
  id: string
  ingredient_id: string | null
  quantity_purchased: number
  unit: string
  total_price_paid: number
  cost_per_unit_calculated: number | null
  purchase_date: string
  notes: string | null
  ingredients: { id: string; name: string }[] | null
}

interface InventoryClientProps {
  ingredients: Ingredient[]
  recentPurchases: Purchase[]
}

const CATEGORIES = [
  { value: 'all',         label: 'All' },
  { value: 'panna_cotta', label: 'Panna Cotta' },
  { value: 'lemon_bar',   label: 'Lemon Bar' },
  { value: 'truffle',     label: 'Truffle' },
  { value: 'shared',      label: 'Shared' },
  { value: 'chai',        label: 'Chai' },
  { value: 'packaging',   label: 'Packaging' },
]

const CATEGORY_BADGE: Record<string, 'terracotta' | 'gold' | 'green' | 'muted'> = {
  panna_cotta: 'terracotta',
  lemon_bar:   'gold',
  truffle:     'gold',
  shared:      'green',
  chai:        'terracotta',
  packaging:   'muted',
}

// Unit conversion factors (to base unit)
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  g:  { g: 1, kg: 0.001 },
  kg: { kg: 1, g: 1000 },
  ml: { ml: 1, L: 0.001 },
  L:  { L: 1, ml: 1000 },
}

function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value
  const conversions = UNIT_CONVERSIONS[fromUnit]
  if (!conversions || !conversions[toUnit]) return value
  return value * conversions[toUnit]
}

function getDisplayUnit(baseUnit: string, displayMode: 'base' | 'alt'): string {
  if (displayMode === 'base') return baseUnit
  if (baseUnit === 'g') return 'kg'
  if (baseUnit === 'ml') return 'L'
  return baseUnit
}

function stockStatus(ing: Ingredient): 'ok' | 'low' | 'out' {
  if (ing.stock_on_hand <= 0) return 'out'
  if (ing.low_stock_threshold > 0 && ing.stock_on_hand <= ing.low_stock_threshold) return 'low'
  return 'ok'
}

export function InventoryClient({ ingredients, recentPurchases }: InventoryClientProps) {
  const [category, setCategory] = useState('all')
  const [unitMode, setUnitMode] = useState<'base' | 'alt'>('base')
  const [logTab, setLogTab] = useState<'purchases' | 'price_history'>('purchases')
  const [purchaseTarget, setPurchaseTarget] = useState<Ingredient | null>(null)
  const [adjustTarget, setAdjustTarget]     = useState<Ingredient | null>(null)
  const [showAddIngredient, setShowAddIngredient] = useState(false)

  const outCount = ingredients.filter(i => stockStatus(i) === 'out').length
  const lowCount = ingredients.filter(i => stockStatus(i) === 'low').length

  const filtered = category === 'all'
    ? ingredients
    : ingredients.filter(i => i.category === category)

  const sorted = [...filtered].sort((a, b) => {
    const order = { out: 0, low: 1, ok: 2 } as const
    const diff = order[stockStatus(a)] - order[stockStatus(b)]
    return diff !== 0 ? diff : a.name.localeCompare(b.name)
  })

  function displayQty(ing: Ingredient) {
    const dispUnit = getDisplayUnit(ing.unit, unitMode)
    const converted = convertUnit(ing.stock_on_hand, ing.unit, dispUnit)
    const precision = dispUnit === 'kg' || dispUnit === 'L' ? 3 : 0
    return { value: precision > 0 ? converted.toFixed(precision) : converted, unit: dispUnit }
  }
  function displayThreshold(ing: Ingredient) {
    const dispUnit = getDisplayUnit(ing.unit, unitMode)
    const converted = convertUnit(ing.low_stock_threshold, ing.unit, dispUnit)
    const precision = dispUnit === 'kg' || dispUnit === 'L' ? 3 : 0
    return { value: precision > 0 ? converted.toFixed(precision) : converted, unit: dispUnit }
  }

  const hasAltUnits = ingredients.some(i => i.unit === 'g' || i.unit === 'ml')

  return (
    <>
      {/* Reorder panel — shown at top if there are alerts */}
      <ReorderPanel ingredients={ingredients} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{ingredients.length}</p>
          <p className="text-xs text-muted mt-0.5">Total Ingredients</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          lowCount > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', lowCount > 0 ? 'text-amber-700' : 'text-espresso')}>
            {lowCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Low Stock</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          outCount > 0 ? 'bg-status-red/10 border-status-red/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', outCount > 0 ? 'text-status-red' : 'text-espresso')}>
            {outCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Out of Stock</p>
        </div>
      </div>

      {/* Ingredient table */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 mb-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-espresso/10 gap-2 flex-wrap">
          {/* Category tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map(cat => {
              const catCount = cat.value === 'all'
                ? ingredients.length
                : ingredients.filter(i => i.category === cat.value).length
              if (cat.value !== 'all' && catCount === 0) return null
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    category === cat.value
                      ? 'bg-espresso text-cream'
                      : 'text-muted hover:text-espresso hover:bg-espresso/5'
                  )}
                >
                  {cat.label}
                  <span className="ml-1.5 opacity-60">{catCount}</span>
                </button>
              )
            })}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasAltUnits && (
              <button
                onClick={() => setUnitMode(m => m === 'base' ? 'alt' : 'base')}
                className="px-3 py-1.5 text-xs font-medium text-muted bg-espresso/5 hover:bg-espresso/10 rounded-lg transition-colors"
              >
                Show in {unitMode === 'base' ? 'kg / L' : 'g / ml'}
              </button>
            )}
            <Button variant="primary" size="sm" onClick={() => setShowAddIngredient(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Ingredient
            </Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={32} className="text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No ingredients in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Ingredient
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Threshold
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Cost / Unit
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {sorted.map(ing => {
                  const status = stockStatus(ing)
                  const qty = displayQty(ing)
                  const thresh = displayThreshold(ing)
                  return (
                    <tr key={ing.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            status === 'ok'  ? 'bg-status-green' :
                            status === 'low' ? 'bg-status-amber' : 'bg-status-red'
                          )} />
                          <span className="font-medium text-espresso">{ing.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {ing.category
                          ? <Badge variant={CATEGORY_BADGE[ing.category] ?? 'muted'}>
                              {ing.category.replace('_', ' ')}
                            </Badge>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={cn(
                          'font-medium',
                          status === 'out' ? 'text-status-red' :
                          status === 'low' ? 'text-amber-700' : 'text-espresso'
                        )}>
                          {qty.value}
                        </span>
                        <span className="text-muted ml-1 text-xs">{qty.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted text-xs">
                        {ing.low_stock_threshold > 0
                          ? `${thresh.value} ${thresh.unit}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-medium text-espresso">{formatTTD(ing.cost_per_unit)}</span>
                        <span className="text-muted text-xs ml-1">/ {ing.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPurchaseTarget(ing)}
                            className="px-2.5 py-1 text-xs font-medium text-terracotta bg-terracotta/10 hover:bg-terracotta/20 rounded-lg transition-colors whitespace-nowrap"
                          >
                            + Purchase
                          </button>
                          <button
                            onClick={() => setAdjustTarget(ing)}
                            className="px-2.5 py-1 text-xs font-medium text-muted bg-espresso/5 hover:bg-espresso/10 rounded-lg transition-colors"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log tabs */}
      <div className="flex items-center gap-1 border-b border-espresso/10 mb-0 -mt-3 mb-4">
        {[
          { value: 'purchases',     label: 'Purchase Log' },
          { value: 'price_history', label: 'Price History' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setLogTab(tab.value as typeof logTab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              logTab === tab.value
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-muted hover:text-espresso'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {logTab === 'price_history' ? (
        <PriceHistoryTab
          purchases={recentPurchases.map(p => ({
            ...p,
            ingredients: p.ingredients ? p.ingredients.map(i => ({ id: (i as {id?: string}).id ?? '', name: i.name })) : null,
          }))}
          ingredients={ingredients}
        />
      ) : (
      /* Recent Purchases */
      <div className="bg-cream rounded-card shadow-card border border-cream/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Purchase Log</h3>
          <span className="text-xs text-muted">{recentPurchases.length} records</span>
        </div>

        {recentPurchases.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingCart size={28} className="text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No purchases logged yet</p>
            <p className="text-xs text-muted mt-0.5">Use the &quot;+ Purchase&quot; button on any ingredient to record a purchase</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Ingredient</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Quantity</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Total Paid</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Cost / Unit</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {recentPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-espresso/5 transition-colors">
                    <td className="px-5 py-2.5 text-muted tabular-nums whitespace-nowrap text-xs">
                      {formatDate(p.purchase_date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-espresso">
                      {p.ingredients?.[0]?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-espresso">
                      {p.quantity_purchased} {p.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-espresso">
                      {formatTTD(p.total_price_paid)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                      {p.cost_per_unit_calculated ? formatTTD(p.cost_per_unit_calculated) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-muted text-xs">
                      {p.notes ?? <span className="opacity-40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modals */}
      {purchaseTarget && (
        <AddPurchaseModal
          ingredient={purchaseTarget}
          onClose={() => setPurchaseTarget(null)}
        />
      )}
      {adjustTarget && (
        <StockAdjustModal
          ingredient={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}
      {showAddIngredient && (
        <AddIngredientModal onClose={() => setShowAddIngredient(false)} />
      )}
    </>
  )
}
