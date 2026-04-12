import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcBatchCost, calcCostPerUnit, suggestDirectPrice, suggestCafePrice, marginStatus } from '@/lib/pricing'
import { formatTTD, formatPercent } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  panna_cotta: 'Panna Cotta',
  truffle:     'Truffle',
  bar:         'Bar',
  concentrate: 'Concentrate',
  syrup:       'Syrup',
}

const CATEGORY_VARIANTS: Record<string, 'terracotta' | 'gold' | 'green' | 'muted'> = {
  panna_cotta: 'terracotta',
  truffle:     'gold',
  bar:         'green',
  concentrate: 'muted',
  syrup:       'muted',
}

function marginBadge(margin: number, channel: 'direct' | 'cafe') {
  const s = marginStatus(margin, channel)
  const v = { strong: 'green', healthy: 'gold', warning: 'amber', danger: 'red' }[s] as 'green' | 'gold' | 'amber' | 'red'
  return <Badge variant={v}>{formatPercent(margin, 0)}</Badge>
}

type RecipeRow = {
  id: string
  name: string
  category: string | null
  base_yield_units: number
  yield_unit_label: string
  is_active: boolean
  recipe_ingredients: Array<{
    quantity: number
    ingredients: { cost_per_unit: number } | null
  }>
}

export default async function RecipesPage() {
  const supabase = await createClient()

  type RecipesResult = { data: RecipeRow[] | null; error: { message: string } | null }
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id, name, category, base_yield_units, yield_unit_label, is_active,
      recipe_ingredients(
        quantity,
        ingredients(cost_per_unit)
      )
    `)
    .order('name') as unknown as RecipesResult

  const recipes = data ?? []

  const costed = recipes.map(r => {
    const ings = r.recipe_ingredients.map(ri => ({
      quantity: ri.quantity,
      cost_per_unit: ri.ingredients?.cost_per_unit ?? 0,
    }))
    const batchCost    = calcBatchCost(ings)
    const costPerUnit  = calcCostPerUnit(batchCost, r.base_yield_units)
    const directPrice  = suggestDirectPrice(costPerUnit)
    const cafePrice    = suggestCafePrice(costPerUnit)
    const directMargin = directPrice > 0 ? ((directPrice - costPerUnit) / directPrice) * 100 : 0
    const cafeMargin   = cafePrice   > 0 ? ((cafePrice   - costPerUnit) / cafePrice)   * 100 : 0
    return { ...r, batchCost, costPerUnit, directPrice, cafePrice, directMargin, cafeMargin }
  })

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Recipes</h2>
          <p className="text-sm text-muted mt-0.5">{costed.length} recipe{costed.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/recipes/new">
          <Button><Plus size={16} />New Recipe</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load recipes. Ensure the database schema has been applied in Supabase.
        </div>
      )}

      {costed.length === 0 && !error ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <BookOpen size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No recipes yet</h3>
          <p className="text-muted mb-5">Add your first recipe to start costing and planning production.</p>
          <Link href="/recipes/new">
            <Button><Plus size={16} />Add First Recipe</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  {['Recipe', 'Category', 'Yield', 'Batch Cost', 'Cost / Unit', 'Direct ↑', 'Margin', 'Café ↑', 'Margin'].map((h, i) => (
                    <th
                      key={h + i}
                      className={cn(
                        'py-3 font-medium text-muted text-xs uppercase tracking-wider',
                        i === 0 ? 'text-left px-5' : i <= 2 ? 'text-left px-4' : 'text-right px-4'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {costed.map(r => (
                  <tr key={r.id} className={cn('hover:bg-espresso/5 transition-colors', !r.is_active && 'opacity-50')}>
                    <td className="px-5 py-4">
                      <Link href={`/recipes/${r.id}`} className="font-medium text-espresso hover:text-terracotta transition-colors">
                        {r.name}
                      </Link>
                      {!r.is_active && <span className="ml-2 text-xs text-muted">(inactive)</span>}
                    </td>
                    <td className="px-4 py-4">
                      {r.category
                        ? <Badge variant={CATEGORY_VARIANTS[r.category] ?? 'muted'}>{CATEGORY_LABELS[r.category] ?? r.category}</Badge>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-espresso tabular-nums">
                      {r.base_yield_units} × {r.yield_unit_label}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {r.batchCost > 0 ? formatTTD(r.batchCost) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-espresso tabular-nums">
                      {r.costPerUnit > 0 ? formatTTD(r.costPerUnit) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-espresso">
                      {r.directPrice > 0 ? formatTTD(r.directPrice) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {r.directMargin > 0 ? marginBadge(r.directMargin, 'direct') : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-espresso">
                      {r.cafePrice > 0 ? formatTTD(r.cafePrice) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {r.cafeMargin > 0 ? marginBadge(r.cafeMargin, 'cafe') : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
