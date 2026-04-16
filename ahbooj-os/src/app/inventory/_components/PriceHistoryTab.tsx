'use client'

import { useState } from 'react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'

type Purchase = {
  id: string
  ingredient_id: string | null
  quantity_purchased: number
  unit: string
  total_price_paid: number
  cost_per_unit_calculated: number | null
  purchase_date: string
  notes: string | null
  ingredients: { name: string; id: string }[] | null
}

type Ingredient = { id: string; name: string }

export function PriceHistoryTab({
  purchases,
  ingredients,
}: {
  purchases: Purchase[]
  ingredients: Ingredient[]
}) {
  const [selectedId, setSelectedId] = useState<string>('all')

  const filtered = selectedId === 'all'
    ? purchases
    : purchases.filter(p => p.ingredient_id === selectedId)

  // Compute price trend for selected ingredient
  const hasTrend = selectedId !== 'all' && filtered.length >= 2
  const trend = hasTrend
    ? filtered[0].cost_per_unit_calculated! - filtered[filtered.length - 1].cost_per_unit_calculated!
    : null

  // Group by ingredient for "all" view — find each ingredient's last 3 prices
  const ingredientHistory = ingredients
    .map(ing => {
      const ingPurchases = purchases
        .filter(p => p.ingredient_id === ing.id)
        .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))
        .slice(0, 3)
      if (ingPurchases.length < 2) return null
      const latest = ingPurchases[0].cost_per_unit_calculated ?? 0
      const prev   = ingPurchases[1].cost_per_unit_calculated ?? 0
      const change = prev > 0 ? ((latest - prev) / prev) * 100 : 0
      return { ...ing, purchases: ingPurchases, latest, prev, change }
    })
    .filter(Boolean) as Array<{ id: string; name: string; purchases: Purchase[]; latest: number; prev: number; change: number }>

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted font-medium">Filter:</span>
        <button
          onClick={() => setSelectedId('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            selectedId === 'all' ? 'bg-espresso text-cream' : 'text-muted hover:bg-espresso/5'
          )}
        >
          Price Changes
        </button>
        {ingredients.map(ing => {
          const count = purchases.filter(p => p.ingredient_id === ing.id).length
          if (count < 2) return null
          return (
            <button
              key={ing.id}
              onClick={() => setSelectedId(ing.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                selectedId === ing.id ? 'bg-espresso text-cream' : 'text-muted hover:bg-espresso/5'
              )}
            >
              {ing.name}
            </button>
          )
        })}
      </div>

      {selectedId === 'all' ? (
        /* Show ingredients with price changes */
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          {ingredientHistory.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted text-center">
              No price history yet — need at least 2 purchases per ingredient.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Ingredient</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Previous Cost</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Latest Cost</th>
                  <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {ingredientHistory
                  .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                  .map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className="hover:bg-espresso/5 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 font-medium text-espresso">{row.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{formatTTD(row.prev)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">{formatTTD(row.latest)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          row.change > 5  ? 'bg-red-100 text-red-700' :
                          row.change < -5 ? 'bg-green-100 text-green-700' :
                          'bg-espresso/10 text-espresso'
                        )}>
                          {row.change > 0 ? '+' : ''}{row.change.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Show full history for selected ingredient */
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          {hasTrend && trend !== null && (
            <div className={cn(
              'px-5 py-3 border-b text-sm flex items-center gap-2',
              trend > 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
            )}>
              {trend > 0 ? '↑' : '↓'}
              Price has {trend > 0 ? 'increased' : 'decreased'} by{' '}
              <strong>{formatTTD(Math.abs(trend))}/unit</strong> since first purchase
            </div>
          )}
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted text-center">No purchase history.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Quantity</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Total Paid</th>
                  <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Cost / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {filtered.map((p, i) => {
                  const prev = filtered[i + 1]?.cost_per_unit_calculated
                  const curr = p.cost_per_unit_calculated
                  const pctChange = prev && curr ? ((curr - prev) / prev) * 100 : null
                  return (
                    <tr key={p.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="px-5 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                        {formatDate(p.purchase_date, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-espresso">
                        {p.quantity_purchased} {p.unit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {formatTTD(p.total_price_paid)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <span className="font-medium text-espresso">
                          {curr ? formatTTD(curr) : '—'}
                        </span>
                        {pctChange !== null && (
                          <span className={cn(
                            'ml-2 text-xs',
                            pctChange > 0 ? 'text-red-600' : pctChange < 0 ? 'text-green-600' : 'text-muted'
                          )}>
                            {pctChange > 0 ? '↑' : '↓'}{Math.abs(pctChange).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
