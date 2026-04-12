import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil, FlaskConical } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcBatchCost, calcCostPerUnit } from '@/lib/pricing'
import { formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RecipeScaler } from './_components/RecipeScaler'

const CATEGORY_LABELS: Record<string, string> = {
  panna_cotta: 'Panna Cotta',
  truffle: 'Truffle',
  bar: 'Bar',
  concentrate: 'Concentrate',
  syrup: 'Syrup',
}

type RecipeDetail = {
  id: string
  name: string
  category: string | null
  base_yield_units: number
  yield_unit_label: string
  instructions: string | null
  notes: string | null
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
  recipe_ingredients: Array<{
    id: string
    quantity: number
    unit: string
    notes: string | null
    ingredients: {
      id: string
      name: string
      unit: string
      cost_per_unit: number
      category: string | null
    } | null
  }>
}

type BatchRow = {
  id: string
  batch_number: string | null
  production_date: string
  planned_yield: number | null
  actual_yield: number | null
  batch_cost: number | null
  qc_passed: boolean | null
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  type RecipeQueryResult = { data: RecipeDetail | null; error: { message: string } | null }
  type BatchQueryResult  = { data: BatchRow[] | null;    error: { message: string } | null }
  type ProductQueryResult = { data: { id: string; name: string; direct_price: number | null; cafe_price: number | null } | null; error: { message: string } | null }

  const recipeRes = await supabase
    .from('recipes')
    .select(`
      id, name, category, base_yield_units, yield_unit_label,
      instructions, notes, is_active, version, created_at, updated_at,
      recipe_ingredients(
        id, quantity, unit, notes,
        ingredients(id, name, unit, cost_per_unit, category)
      )
    `)
    .eq('id', id)
    .single() as unknown as RecipeQueryResult

  if (recipeRes.error || !recipeRes.data) notFound()
  const recipe = recipeRes.data!

  const batchesRes = await supabase
    .from('production_batches')
    .select('id, batch_number, production_date, planned_yield, actual_yield, batch_cost, qc_passed')
    .eq('recipe_id', id)
    .order('production_date', { ascending: false })
    .limit(8) as unknown as BatchQueryResult
  const batches = batchesRes.data ?? []

  const productRes = await supabase
    .from('products')
    .select('id, name, direct_price, cafe_price')
    .eq('recipe_id', id)
    .maybeSingle() as unknown as ProductQueryResult
  const product = productRes.data

  // Costing
  const scalerIngredients = recipe.recipe_ingredients
    .filter(ri => ri.ingredients)
    .map(ri => ({
      id: ri.ingredients!.id,
      name: ri.ingredients!.name,
      unit: ri.unit,
      quantity: ri.quantity,
      cost_per_unit: ri.ingredients!.cost_per_unit,
      notes: ri.notes,
    }))

  const batchCost   = calcBatchCost(scalerIngredients)
  const costPerUnit = calcCostPerUnit(batchCost, recipe.base_yield_units)

  return (
    <PageWrapper>
      {/* Back nav */}
      <div className="mb-5">
        <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          All Recipes
        </Link>
      </div>

      {/* Recipe header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {recipe.category && (
              <Badge variant="terracotta">
                {CATEGORY_LABELS[recipe.category] ?? recipe.category}
              </Badge>
            )}
            {!recipe.is_active && <Badge variant="muted">Inactive</Badge>}
            <span className="text-xs text-muted">v{recipe.version}</span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-espresso">
            {recipe.name}
          </h2>
          <p className="text-sm text-muted mt-1">
            Base yield: {recipe.base_yield_units} × {recipe.yield_unit_label}
          </p>
        </div>
        <div className="flex gap-2 mt-1">
          <Link href={`/recipes/${id}/edit`}>
            <Button variant="ghost" size="sm">
              <Pencil size={14} />
              Edit
            </Button>
          </Link>
          <Link href="/production">
            <Button size="sm">
              <FlaskConical size={14} />
              Log Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Left: recipe info (3/5) */}
        <div className="xl:col-span-3 space-y-5">

          {/* Instructions */}
          {recipe.instructions && (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
              <h3 className="font-display font-semibold text-espresso mb-3">Instructions</h3>
              <p className="text-sm text-espresso/80 whitespace-pre-line leading-relaxed">
                {recipe.instructions}
              </p>
            </div>
          )}

          {/* Linked product notice */}
          {product && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
              <span className="text-espresso">
                Linked to product: <Link href={`/products`} className="font-medium hover:text-terracotta">{product.name}</Link>
              </span>
              <div className="flex gap-3 text-xs text-muted">
                {product.direct_price && <span>Direct: TT${product.direct_price}</span>}
                {product.cafe_price && <span>Café: TT${product.cafe_price}</span>}
              </div>
            </div>
          )}

          {/* Notes */}
          {recipe.notes && (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
              <h3 className="font-display font-semibold text-espresso mb-2">Notes</h3>
              <p className="text-sm text-muted whitespace-pre-line">{recipe.notes}</p>
            </div>
          )}

          {/* Production history */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-espresso">Production History</h3>
              <Link href="/production" className="text-xs text-terracotta hover:underline">
                All batches →
              </Link>
            </div>
            {batches.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No batches logged for this recipe yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-espresso/10">
                    <th className="text-left py-2 text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                    <th className="text-left py-2 text-xs font-medium text-muted uppercase tracking-wider">Batch #</th>
                    <th className="text-right py-2 text-xs font-medium text-muted uppercase tracking-wider">Yield</th>
                    <th className="text-right py-2 text-xs font-medium text-muted uppercase tracking-wider">Cost</th>
                    <th className="text-right py-2 text-xs font-medium text-muted uppercase tracking-wider">QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/5">
                  {batches.map(b => (
                    <tr key={b.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="py-2.5 text-muted">{formatDate(b.production_date, 'MMM d')}</td>
                      <td className="py-2.5 text-espresso font-mono text-xs">{b.batch_number ?? '—'}</td>
                      <td className="py-2.5 text-right tabular-nums text-espresso">
                        {b.actual_yield ?? b.planned_yield ?? '—'}
                        {b.planned_yield && b.actual_yield && b.actual_yield !== b.planned_yield && (
                          <span className="text-muted text-xs ml-1">(plan: {b.planned_yield})</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted">
                        {b.batch_cost ? `TT$${b.batch_cost.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        {b.qc_passed === true && <span className="text-status-green text-xs font-medium">Pass</span>}
                        {b.qc_passed === false && <span className="text-status-red text-xs font-medium">Fail</span>}
                        {b.qc_passed === null && <span className="text-muted text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Meta */}
          <p className="text-xs text-muted">
            Created {formatDate(recipe.created_at)} · Last updated {formatDate(recipe.updated_at)}
          </p>
        </div>

        {/* Right: scaler + costing (2/5) */}
        <div className="xl:col-span-2">
          {scalerIngredients.length === 0 ? (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-8 text-center">
              <p className="text-muted text-sm">
                Add ingredients to this recipe to see costing and pricing analysis.
              </p>
            </div>
          ) : (
            <RecipeScaler
              baseYield={recipe.base_yield_units}
              yieldUnitLabel={recipe.yield_unit_label}
              ingredients={scalerIngredients}
              existingDirectPrice={product?.direct_price}
              existingCafePrice={product?.cafe_price}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
