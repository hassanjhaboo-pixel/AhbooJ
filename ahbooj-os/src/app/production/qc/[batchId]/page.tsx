import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTTD } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { QCForm } from './_components/QCForm'

type BatchDetail = {
  id: string
  batch_number: string | null
  production_date: string
  planned_yield: number | null
  actual_yield: number | null
  batch_cost: number | null
  cost_per_unit: number | null
  qc_passed: boolean | null
  qc_notes: string | null
  recipes: { name: string }[] | null
}

type QCLogRow = {
  check_category: string | null
  check_name: string | null
  passed: boolean | null
  notes: string | null
}

export default async function QCPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const supabase = await createClient()

  const { data: batchData } = await supabase
    .from('production_batches')
    .select('id, batch_number, production_date, planned_yield, actual_yield, batch_cost, cost_per_unit, qc_passed, qc_notes, recipes(name)')
    .eq('id', batchId)
    .maybeSingle() as unknown as { data: BatchDetail | null }

  if (!batchData) notFound()

  const { data: logData } = await supabase
    .from('production_qc_log')
    .select('check_category, check_name, passed, notes')
    .eq('batch_id', batchId) as unknown as { data: QCLogRow[] | null }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/production" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Production
        </Link>
      </div>

      {/* Batch header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-2xl font-semibold text-espresso">QC Review</h2>
            {batchData.qc_passed === true  && <Badge variant="green">Passed</Badge>}
            {batchData.qc_passed === false && <Badge variant="red">Failed</Badge>}
            {batchData.qc_passed === null  && <Badge variant="amber">Pending</Badge>}
          </div>
          <p className="text-sm text-muted">
            {batchData.recipes?.[0]?.name ?? 'Batch'}{' · '}
            {formatDate(batchData.production_date, 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-xs text-muted mt-0.5 font-mono">
            {batchData.batch_number ?? batchId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="text-right space-y-1">
          {batchData.planned_yield && (
            <p className="text-xs text-muted">Planned: <span className="font-medium text-espresso">{batchData.planned_yield} units</span></p>
          )}
          {batchData.batch_cost && (
            <p className="text-xs text-muted">Batch cost: <span className="font-medium text-espresso">{formatTTD(batchData.batch_cost)}</span></p>
          )}
        </div>
      </div>

      <QCForm
        batchId={batchId}
        currentActualYield={batchData.actual_yield}
        currentQcNotes={batchData.qc_notes}
        existingChecks={logData ?? []}
      />
    </PageWrapper>
  )
}
