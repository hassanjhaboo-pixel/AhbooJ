import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FlaskConical } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatTTD, formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { StatusUpdater } from './_components/StatusUpdater'

type OrderDetail = {
  id: string
  order_number: string | null
  order_date: string
  status: string
  payment_status: string | null
  channel: string | null
  subtotal: number | null
  total: number | null
  notes: string | null
  customers: { id: string; name: string; phone: string | null; email: string | null; instagram_handle: string | null }[] | null
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    line_total: number | null
    products: { id: string; name: string; sku: string | null } | null
  }>
}

type BatchRow = {
  id: string
  batch_number: string | null
  production_date: string
  planned_yield: number | null
  actual_yield: number | null
  qc_passed: boolean | null
  recipes: { name: string }[] | null
}

const CHANNEL_LABEL: Record<string, string> = {
  direct:    'Direct',
  instagram: 'Instagram',
  whatsapp:  'WhatsApp',
  market:    'Market',
  referral:  'Referral',
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  type QueryResult = { data: OrderDetail | null; error: { message: string } | null }

  let res = await supabase
    .from('orders')
    .select(`
      id, order_number, order_date, status, payment_status, channel, subtotal, total, notes,
      customers(id, name, phone, email, instagram_handle),
      order_items(id, quantity, unit_price, line_total, products(id, name, sku))
    `)
    .eq('id', id)
    .maybeSingle() as unknown as QueryResult

  // payment_status column may not exist if v2 migration hasn't been applied yet
  if (res.error?.message?.toLowerCase().includes('payment_status')) {
    const fb = await supabase
      .from('orders')
      .select(`
        id, order_number, order_date, status, channel, subtotal, total, notes,
        customers(id, name, phone, email, instagram_handle),
        order_items(id, quantity, unit_price, line_total, products(id, name, sku))
      `)
      .eq('id', id)
      .maybeSingle() as unknown as QueryResult
    res = { data: fb.data ? { ...fb.data, payment_status: null } : null, error: fb.error }
  }

  if (!res.data) notFound()
  const data = res.data!

  const customer = data.customers?.[0] ?? null

  // Linked production batches (v3 schema — graceful skip if column missing)
  type BatchQueryResult = { data: BatchRow[] | null; error: { message: string } | null }
  let linkedBatches: BatchRow[] = []
  const batchRes = await supabase
    .from('production_batches')
    .select('id, batch_number, production_date, planned_yield, actual_yield, qc_passed, recipes(name)')
    .eq('linked_order_id', id)
    .order('production_date', { ascending: false }) as unknown as BatchQueryResult

  if (!batchRes.error?.message?.toLowerCase().includes('linked_order_id')) {
    linkedBatches = batchRes.data ?? []
  }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          All Orders
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-display text-2xl font-semibold text-espresso font-mono">
              {data.order_number ?? id.slice(0, 8).toUpperCase()}
            </h2>
            {data.channel && (
              <Badge variant="muted">{CHANNEL_LABEL[data.channel] ?? data.channel}</Badge>
            )}
          </div>
          <p className="text-sm text-muted">
            {formatDate(data.order_date, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Total</p>
          <p className="font-display text-2xl font-semibold text-espresso">
            {data.total ? formatTTD(data.total) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: items + notes + linked batches */}
        <div className="lg:col-span-2 space-y-5">
          {/* Line items */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-espresso/10">
              <h3 className="font-display font-semibold text-espresso">Items</h3>
            </div>
            {data.order_items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No items on this order.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-espresso/10 bg-espresso/5">
                    <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Product</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Qty</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Unit Price</th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/5">
                  {data.order_items.map(item => (
                    <tr key={item.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-espresso">
                        {item.products?.name ?? '—'}
                        {item.products?.sku && (
                          <span className="ml-1.5 text-xs text-muted font-mono font-normal">{item.products.sku}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-espresso">{item.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{formatTTD(item.unit_price)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-espresso">
                        {item.line_total ? formatTTD(item.line_total) : formatTTD(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-espresso/10 bg-espresso/5">
                    <td colSpan={3} className="px-5 py-3 text-right text-sm font-medium text-espresso">Total</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-espresso font-display">
                      {data.total ? formatTTD(data.total) : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
              <h3 className="font-display font-semibold text-espresso mb-2">Notes</h3>
              <p className="text-sm text-espresso whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}

          {/* Linked production batches */}
          {linkedBatches.length > 0 && (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center gap-2">
                <FlaskConical size={14} className="text-muted" />
                <h3 className="font-display font-semibold text-espresso text-sm">Production Batches</h3>
                <span className="text-xs text-muted">({linkedBatches.length})</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-espresso/10 bg-espresso/5">
                    <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Batch</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Recipe</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Yield</th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/5">
                  {linkedBatches.map(b => (
                    <tr key={b.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="px-5 py-2.5 text-muted text-xs tabular-nums">
                        {formatDate(b.production_date, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-espresso">{b.batch_number ?? '—'}</td>
                      <td className="px-4 py-2.5 text-espresso text-xs">{b.recipes?.[0]?.name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-xs text-espresso">
                        {b.actual_yield ?? b.planned_yield ?? '—'}
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs">
                        {b.qc_passed === true  && <span className="text-status-green font-medium">Pass</span>}
                        {b.qc_passed === false && <span className="text-status-red font-medium">Fail</span>}
                        {b.qc_passed === null  && <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: status + customer */}
        <div className="space-y-5">
          {/* Status updater */}
          <StatusUpdater
            orderId={data.id}
            currentStatus={data.status}
            currentPaymentStatus={data.payment_status ?? 'unpaid'}
          />

          {/* Customer */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
            <h3 className="font-display font-semibold text-espresso mb-3">Customer</h3>
            {customer ? (
              <div className="space-y-1.5">
                <Link
                  href={`/crm/${customer.id}`}
                  className="font-medium text-espresso hover:text-terracotta transition-colors"
                >
                  {customer.name}
                </Link>
                {customer.phone && (
                  <p className="text-xs text-muted">{customer.phone}</p>
                )}
                {customer.email && (
                  <p className="text-xs text-muted">{customer.email}</p>
                )}
                {customer.instagram_handle && (
                  <p className="text-xs text-muted">{customer.instagram_handle}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">No customer on file</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
