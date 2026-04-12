import Link from 'next/link'
import { FlaskConical, ClipboardCheck } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { calcBatchCost, calcCostPerUnit } from '@/lib/pricing'
import { formatTTD, formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { LogBatchButton } from './_components/LogBatchButton'

type Batch = {
  id: string
  batch_number: string | null
  production_date: string
  planned_yield: number | null
  actual_yield: number | null
  batch_cost: number | null
  cost_per_unit: number | null
  qc_passed: boolean | null
  notes: string | null
  recipes: { name: string }[] | null
}

type RecipeRow = {
  id: string
  name: string
  base_yield_units: number
  recipe_ingredients: Array<{
    quantity: number
    ingredients: { cost_per_unit: number } | null
  }>
}

export default async function ProductionPage() {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data: batchData, error } = await supabase
    .from('production_batches')
    .select('id, batch_number, production_date, planned_yield, actual_yield, batch_cost, cost_per_unit, qc_passed, notes, recipes(name)')
    .order('production_date', { ascending: false })
    .limit(60) as unknown as { data: Batch[] | null; error: { message: string } | null }

  const { data: recipeData } = await supabase
    .from('recipes')
    .select('id, name, base_yield_units, recipe_ingredients(quantity, ingredients(cost_per_unit))')
    .eq('is_active', true)
    .order('name') as unknown as { data: RecipeRow[] | null }

  const batches = batchData ?? []

  // Recipe options with pre-computed single-batch cost
  const recipeOptions = (recipeData ?? []).map(r => ({
    id:               r.id,
    name:             r.name,
    base_yield_units: r.base_yield_units,
    single_batch_cost: calcBatchCost(
      r.recipe_ingredients.map(ri => ({
        quantity:      ri.quantity,
        cost_per_unit: ri.ingredients?.cost_per_unit ?? 0,
      }))
    ),
  }))

  // Stats
  const weekBatches = batches.filter(b =>
    b.production_date >= weekStart && b.production_date <= weekEnd
  )
  const weekYield = weekBatches.reduce((sum, b) => sum + (b.actual_yield ?? b.planned_yield ?? 0), 0)
  const qcChecked = batches.filter(b => b.qc_passed !== null)
  const qcPassRate = qcChecked.length > 0
    ? Math.round((qcChecked.filter(b => b.qc_passed).length / qcChecked.length) * 100)
    : null
  const pendingQC  = batches.filter(b => b.qc_passed === null && b.actual_yield !== null)

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Production</h2>
          <p className="text-sm text-muted mt-0.5">{batches.length} batches logged</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/production/shopping-list" className="text-sm text-muted hover:text-espresso transition-colors">
            Shopping List →
          </Link>
          <LogBatchButton recipes={recipeOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load production data. Ensure the database schema has been applied.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{weekBatches.length}</p>
          <p className="text-xs text-muted mt-0.5">Batches This Week</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{weekYield}</p>
          <p className="text-xs text-muted mt-0.5">Units This Week</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          pendingQC.length > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', pendingQC.length > 0 ? 'text-amber-700' : 'text-espresso')}>
            {qcPassRate !== null ? `${qcPassRate}%` : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">
            QC Pass Rate
            {pendingQC.length > 0 && ` · ${pendingQC.length} pending`}
          </p>
        </div>
      </div>

      {/* Pending QC alert */}
      {pendingQC.length > 0 && (
        <div className="bg-status-amber/10 border border-status-amber/30 rounded-lg p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <ClipboardCheck size={16} />
            <span>{pendingQC.length} batch{pendingQC.length !== 1 ? 'es' : ''} awaiting QC review</span>
          </div>
          <Link href={`/production/qc/${pendingQC[0].id}`} className="text-xs font-medium text-terracotta hover:underline">
            Start QC →
          </Link>
        </div>
      )}

      {batches.length === 0 && !error ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <FlaskConical size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No batches yet</h3>
          <p className="text-muted text-sm mb-5">Log your first production batch to start tracking yields and costs.</p>
          <LogBatchButton recipes={recipeOptions} />
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Batch</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Recipe</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Planned</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Actual</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Batch Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Cost/Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">QC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-espresso/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      {b.batch_number ?? b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-espresso">
                      {b.recipes?.[0]?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs tabular-nums">
                      {formatDate(b.production_date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">{b.planned_yield ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">{b.actual_yield ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {b.batch_cost ? formatTTD(b.batch_cost) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">
                      {b.cost_per_unit ? formatTTD(b.cost_per_unit) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {b.qc_passed === true  && <Badge variant="green">Passed</Badge>}
                      {b.qc_passed === false && <Badge variant="red">Failed</Badge>}
                      {b.qc_passed === null && b.actual_yield !== null && (
                        <Link href={`/production/qc/${b.id}`} className="text-xs text-terracotta hover:underline">
                          Run QC →
                        </Link>
                      )}
                      {b.qc_passed === null && b.actual_yield === null && (
                        <span className="text-xs text-muted">Pending</span>
                      )}
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
