import Link from 'next/link'
import { formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'

interface Batch {
  id: string
  batch_number: string | null
  production_date: string
  planned_yield: number | null
  actual_yield: number | null
  qc_passed: boolean | null
  recipes: { name: string } | null
}

interface ProductionCardProps {
  batches: Batch[]
  pendingOrdersCount: number
}

export function ProductionCard({ batches, pendingOrdersCount }: ProductionCardProps) {
  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-espresso">This Week</h3>
        <Link href="/production" className="text-xs text-terracotta hover:underline">
          Production →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-warm-white rounded-lg p-3 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{batches.length}</p>
          <p className="text-xs text-muted mt-0.5">Batches</p>
        </div>
        <div className="bg-warm-white rounded-lg p-3 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{pendingOrdersCount}</p>
          <p className="text-xs text-muted mt-0.5">Orders pending</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <p className="text-xs text-muted text-center py-2">No batches logged this week</p>
      ) : (
        <ul className="space-y-1.5">
          {batches.slice(0, 4).map(batch => (
            <li key={batch.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  batch.qc_passed === true ? 'bg-status-green' :
                  batch.qc_passed === false ? 'bg-status-red' : 'bg-status-amber'
                )} />
                <span className="text-xs text-espresso truncate">
                  {batch.recipes?.name ?? 'Batch'}
                </span>
              </div>
              <span className="text-xs text-muted flex-shrink-0 ml-2">
                {formatDate(batch.production_date, 'EEE d')}
                {batch.actual_yield && ` · ${batch.actual_yield}u`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
