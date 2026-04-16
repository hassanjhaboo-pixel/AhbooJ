'use client'

import { AlertTriangle, ShoppingCart } from 'lucide-react'
import { formatTTD } from '@/lib/formatting'
import { cn } from '@/lib/utils'

interface Ingredient {
  id: string
  name: string
  unit: string
  stock_on_hand: number
  low_stock_threshold: number
  cost_per_unit: number
}

function urgency(ing: Ingredient): 'out' | 'critical' | 'low' {
  if (ing.stock_on_hand <= 0) return 'out'
  if (ing.stock_on_hand < ing.low_stock_threshold * 0.5) return 'critical'
  return 'low'
}

// Suggest reorder quantity: enough to last ~4 weeks at estimated consumption
function suggestedQty(ing: Ingredient): number {
  const target = ing.low_stock_threshold * 4  // 4× threshold as buffer
  const needed = Math.max(target - ing.stock_on_hand, ing.low_stock_threshold * 2)
  return Math.ceil(needed)
}

export function ReorderPanel({ ingredients }: { ingredients: Ingredient[] }) {
  const needsReorder = ingredients
    .filter(i => i.low_stock_threshold > 0 && i.stock_on_hand <= i.low_stock_threshold)
    .sort((a, b) => {
      const u = { out: 0, critical: 1, low: 2 } as const
      return u[urgency(a)] - u[urgency(b)]
    })

  if (needsReorder.length === 0) return null

  const totalEstimatedCost = needsReorder.reduce((sum, ing) => {
    return sum + (suggestedQty(ing) * ing.cost_per_unit)
  }, 0)

  return (
    <div className="bg-cream rounded-card shadow-card border border-status-amber/30 mb-6">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="font-display font-semibold text-espresso text-sm">
            Reorder Suggestions
          </h3>
          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {needsReorder.length} items
          </span>
        </div>
        <p className="text-xs text-muted">
          Est. cost: <span className="font-semibold text-espresso">{formatTTD(totalEstimatedCost)}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-espresso/10 bg-espresso/[0.03]">
              <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Ingredient</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">On Hand</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Threshold</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Suggest Buy</th>
              <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Est. Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-espresso/5">
            {needsReorder.map(ing => {
              const level = urgency(ing)
              const qty = suggestedQty(ing)
              return (
                <tr key={ing.id} className="hover:bg-espresso/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        level === 'out'      ? 'bg-status-red' :
                        level === 'critical' ? 'bg-orange-500' : 'bg-status-amber'
                      )} />
                      <span className="font-medium text-espresso">{ing.name}</span>
                      {level === 'out' && (
                        <span className="text-xs text-status-red font-medium bg-status-red/10 px-1.5 py-0.5 rounded">OUT</span>
                      )}
                    </div>
                  </td>
                  <td className={cn('px-4 py-3 text-right tabular-nums',
                    level === 'out' ? 'text-status-red font-semibold' : 'text-amber-700 font-medium')}>
                    {ing.stock_on_hand} <span className="text-xs text-muted font-normal">{ing.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted text-xs">
                    {ing.low_stock_threshold} {ing.unit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-semibold text-espresso">{qty}</span>
                    <span className="text-xs text-muted ml-1">{ing.unit}</span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-espresso font-medium">
                    {formatTTD(qty * ing.cost_per_unit)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-espresso/10 bg-espresso/[0.03]">
              <td colSpan={4} className="px-5 py-3 text-right text-sm font-medium text-espresso">
                Total estimated reorder cost
              </td>
              <td className="px-5 py-3 text-right font-display font-semibold text-espresso">
                {formatTTD(totalEstimatedCost)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
