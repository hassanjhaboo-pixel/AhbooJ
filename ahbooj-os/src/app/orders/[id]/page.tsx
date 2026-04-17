import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
        {/* Left: items + notes */}
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
