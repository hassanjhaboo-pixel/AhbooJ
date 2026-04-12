import Link from 'next/link'
import { ChevronLeft, ShoppingCart, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { formatTTD } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type UpcomingBatch = {
  id: string
  batch_number: string | null
  production_date: string
  planned_yield: number | null
  recipes: {
    name: string
    base_yield_units: number
    recipe_ingredients: Array<{
      quantity: number
      unit: string
      ingredients: {
        id: string
        name: string
        unit: string
        cost_per_unit: number
        stock_on_hand: number
        low_stock_threshold: number
      } | null
    }>
  }[] | null
}

type StockRow = {
  id: string
  name: string
  unit: string
  stock_on_hand: number
  low_stock_threshold: number
  cost_per_unit: number
}

type AggregatedItem = {
  ingredient_id: string
  name: string
  unit: string
  cost_per_unit: number
  needed_qty: number
  in_stock: number
  to_buy: number
  low_stock_threshold: number
  source: 'batch' | 'low_stock'
}

export default async function ShoppingListPage() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch upcoming planned batches (today onward, not yet QC-passed)
  const { data: batchData } = await supabase
    .from('production_batches')
    .select(`
      id, batch_number, production_date, planned_yield,
      recipes(
        name, base_yield_units,
        recipe_ingredients(
          quantity, unit,
          ingredients(id, name, unit, cost_per_unit, stock_on_hand, low_stock_threshold)
        )
      )
    `)
    .gte('production_date', today)
    .is('qc_passed', null)
    .order('production_date') as unknown as { data: UpcomingBatch[] | null }

  // Fetch all ingredients for low-stock list
  const { data: stockData } = await supabase
    .from('ingredients')
    .select('id, name, unit, stock_on_hand, low_stock_threshold, cost_per_unit')
    .gt('low_stock_threshold', 0)
    .order('name') as unknown as { data: StockRow[] | null }

  const upcomingBatches = batchData ?? []
  const stockItems      = stockData  ?? []

  // ── Aggregate ingredient needs from upcoming batches ──────
  const aggregated: Record<string, AggregatedItem> = {}

  for (const batch of upcomingBatches) {
    const recipe = batch.recipes?.[0]
    if (!recipe) continue

    const scaleFactor = batch.planned_yield && recipe.base_yield_units > 0
      ? batch.planned_yield / recipe.base_yield_units
      : 1

    for (const ri of recipe.recipe_ingredients) {
      const ing = ri.ingredients
      if (!ing) continue

      const needed = ri.quantity * scaleFactor
      const key    = ing.id

      if (aggregated[key]) {
        aggregated[key].needed_qty += needed
        aggregated[key].to_buy     = Math.max(0, aggregated[key].needed_qty - aggregated[key].in_stock)
      } else {
        aggregated[key] = {
          ingredient_id:      ing.id,
          name:               ing.name,
          unit:               ing.unit,
          cost_per_unit:      ing.cost_per_unit,
          needed_qty:         needed,
          in_stock:           ing.stock_on_hand,
          to_buy:             Math.max(0, needed - ing.stock_on_hand),
          low_stock_threshold: ing.low_stock_threshold,
          source:             'batch',
        }
      }
    }
  }

  const batchNeeds = Object.values(aggregated).sort((a, b) => b.to_buy - a.to_buy)

  // ── Low-stock items NOT already in batch needs ─────────────
  const lowStockExtras = stockItems
    .filter(s => s.stock_on_hand <= s.low_stock_threshold && !aggregated[s.id])
    .map(s => ({
      ingredient_id:      s.id,
      name:               s.name,
      unit:               s.unit,
      cost_per_unit:      s.cost_per_unit,
      needed_qty:         0,
      in_stock:           s.stock_on_hand,
      to_buy:             s.low_stock_threshold - s.stock_on_hand,
      low_stock_threshold: s.low_stock_threshold,
      source:             'low_stock' as const,
    }))

  const estimatedCost = batchNeeds
    .filter(i => i.to_buy > 0)
    .reduce((sum, i) => sum + i.to_buy * i.cost_per_unit, 0)

  const hasBatchItems    = batchNeeds.length > 0
  const hasLowStockItems = lowStockExtras.length > 0

  function ItemRow({ item }: { item: AggregatedItem }) {
    const deficit = item.to_buy
    return (
      <tr className={cn(
        'hover:bg-espresso/5 transition-colors',
        deficit > 0 && 'font-medium'
      )}>
        <td className="px-5 py-3 text-espresso">
          <div className="flex items-center gap-2">
            {deficit > 0
              ? <div className="w-1.5 h-1.5 rounded-full bg-status-red flex-shrink-0" />
              : <div className="w-1.5 h-1.5 rounded-full bg-status-green flex-shrink-0" />}
            {item.name}
          </div>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-espresso">
          {item.needed_qty > 0 ? `${item.needed_qty.toFixed(1)} ${item.unit}` : '—'}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className={cn(
            item.in_stock <= item.low_stock_threshold && item.low_stock_threshold > 0
              ? 'text-status-red'
              : 'text-espresso'
          )}>
            {item.in_stock.toFixed(1)} {item.unit}
          </span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {deficit > 0
            ? <span className="font-semibold text-terracotta">{deficit.toFixed(1)} {item.unit}</span>
            : <span className="text-status-green">In stock ✓</span>}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-muted text-xs">
          {deficit > 0 ? formatTTD(deficit * item.cost_per_unit) : '—'}
        </td>
      </tr>
    )
  }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/production" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Production
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Shopping List</h2>
          <p className="text-sm text-muted mt-0.5">
            {upcomingBatches.length > 0
              ? `Based on ${upcomingBatches.length} upcoming batch${upcomingBatches.length !== 1 ? 'es' : ''}`
              : 'No upcoming batches — showing low-stock items'}
          </p>
        </div>
        {estimatedCost > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wider">Est. to buy</p>
            <p className="font-display text-xl font-semibold text-espresso">{formatTTD(estimatedCost)}</p>
          </div>
        )}
      </div>

      {/* Upcoming batches summary */}
      {upcomingBatches.length > 0 && (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 mb-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Planned Batches</p>
          <div className="flex flex-wrap gap-2">
            {upcomingBatches.map(b => (
              <div key={b.id} className="bg-espresso/5 rounded-lg px-3 py-1.5 text-xs text-espresso">
                <span className="font-medium">{b.recipes?.[0]?.name ?? '—'}</span>
                <span className="text-muted ml-1.5">· {b.planned_yield} units · {b.production_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main shopping list */}
      {hasBatchItems ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center gap-2">
            <ShoppingCart size={15} className="text-muted" />
            <h3 className="font-display font-semibold text-espresso text-sm">Ingredients for Upcoming Batches</h3>
            <Badge variant="terracotta">{batchNeeds.filter(i => i.to_buy > 0).length} to buy</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Ingredient</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Needed</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">In Stock</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">To Buy</th>
                  <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {batchNeeds.map(item => <ItemRow key={item.ingredient_id} item={item} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : !hasLowStockItems ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <ShoppingCart size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">Nothing to buy</h3>
          <p className="text-muted text-sm">
            Log upcoming production batches to generate a shopping list, or check the{' '}
            <Link href="/inventory" className="text-terracotta hover:underline">Inventory</Link>{' '}
            page for stock levels.
          </p>
        </div>
      ) : null}

      {/* Low-stock extras */}
      {hasLowStockItems && (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center gap-2">
            <AlertTriangle size={15} className="text-status-amber" />
            <h3 className="font-display font-semibold text-espresso text-sm">Low-Stock Items</h3>
            <span className="text-xs text-muted">(not required by upcoming batches)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Ingredient</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">In Stock</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Threshold</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Deficit</th>
                  <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {lowStockExtras.map(item => (
                  <tr key={item.ingredient_id} className="hover:bg-espresso/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          item.in_stock <= 0 ? 'bg-status-red' : 'bg-status-amber'
                        )} />
                        <span className="text-espresso">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-status-red">{item.in_stock} {item.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{item.low_stock_threshold} {item.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-terracotta">
                      {item.to_buy.toFixed(1)} {item.unit}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted text-xs">
                      {formatTTD(item.to_buy * item.cost_per_unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-espresso/10 bg-espresso/5">
            <p className="text-xs text-muted">
              Use <Link href="/inventory" className="text-terracotta hover:underline">+ Purchase</Link> in Inventory to restock and update costs.
            </p>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
