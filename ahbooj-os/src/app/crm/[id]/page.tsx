import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MessageCircle, Mail, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatTTD, formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { CustomerEditForm } from './_components/CustomerEditForm'
import { MessagingTemplates } from './_components/MessagingTemplates'

type CustomerDetail = {
  id: string
  name: string
  phone: string | null
  email: string | null
  instagram_handle: string | null
  channel: string
  on_whatsapp_list: boolean
  on_email_list: boolean
  total_orders: number
  total_spend: number
  last_order_date: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  birthday_month: number | null
  birthday_day: number | null
}

type OrderRow = {
  id: string
  order_number: string | null
  order_date: string
  status: string
  total: number | null
}

const STATUS_VARIANT: Record<string, 'amber' | 'terracotta' | 'gold' | 'green' | 'muted' | 'red'> = {
  pending:       'amber',
  confirmed:     'terracotta',
  in_production: 'gold',
  ready:         'green',
  delivered:     'muted',
  cancelled:     'red',
}

const CHANNEL_VARIANT: Record<string, 'terracotta' | 'gold' | 'green' | 'muted'> = {
  direct:    'terracotta',
  instagram: 'gold',
  whatsapp:  'green',
  market:    'muted',
  referral:  'muted',
}

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customerData } = await supabase
    .from('customers')
    .select('id, name, phone, email, instagram_handle, channel, on_whatsapp_list, on_email_list, total_orders, total_spend, last_order_date, notes, is_active, created_at, birthday_month, birthday_day')
    .eq('id', id)
    .maybeSingle() as unknown as { data: CustomerDetail | null }

  if (!customerData) notFound()

  const { data: orderData } = await supabase
    .from('orders')
    .select('id, order_number, order_date, status, total')
    .eq('customer_id', id)
    .order('order_date', { ascending: false })
    .limit(20) as unknown as { data: OrderRow[] | null }

  const orders = orderData ?? []

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/crm" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          CRM
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-display text-2xl font-semibold text-espresso">{customerData.name}</h2>
            <Badge variant={CHANNEL_VARIANT[customerData.channel] ?? 'muted'}>
              {customerData.channel}
            </Badge>
            {!customerData.is_active && <Badge variant="muted">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            {customerData.phone && <span>{customerData.phone}</span>}
            {customerData.instagram_handle && <span className="text-gold">{customerData.instagram_handle}</span>}
            {customerData.email && <span>{customerData.email}</span>}
            {customerData.on_whatsapp_list && <span className="flex items-center gap-1 text-status-green"><MessageCircle size={12} />WhatsApp</span>}
            {customerData.on_email_list    && <span className="flex items-center gap-1 text-terracotta"><Mail size={12} />Email list</span>}
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-xs text-muted">Customer since</p>
          <p className="text-sm text-espresso">{formatDate(customerData.created_at, 'MMM yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: orders + stats */}
        <div className="lg:col-span-2 space-y-5">
          {/* Spend stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
              <p className="font-display text-2xl font-semibold text-espresso">{customerData.total_orders}</p>
              <p className="text-xs text-muted mt-0.5">Total Orders</p>
            </div>
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
              <p className="font-display text-2xl font-semibold text-espresso">
                {customerData.total_spend > 0 ? formatTTD(customerData.total_spend) : '—'}
              </p>
              <p className="text-xs text-muted mt-0.5">Total Spend</p>
            </div>
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
              <p className="font-display text-lg font-semibold text-espresso">
                {customerData.total_orders > 0 && customerData.total_spend > 0
                  ? formatTTD(customerData.total_spend / customerData.total_orders)
                  : '—'}
              </p>
              <p className="text-xs text-muted mt-0.5">Avg Order</p>
            </div>
          </div>

          {/* Order history */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center gap-2">
              <ShoppingBag size={15} className="text-muted" />
              <h3 className="font-display font-semibold text-espresso text-sm">Order History</h3>
              <span className="text-xs text-muted">({orders.length})</span>
            </div>
            {orders.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted">No orders yet</p>
                <Link href="/orders/new" className="text-xs text-terracotta hover:underline mt-1 inline-block">
                  Create first order →
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-espresso/10 bg-espresso/5">
                    <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Order</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/5">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="px-5 py-2.5">
                        <Link href={`/orders/${o.id}`} className="font-mono text-xs text-espresso hover:text-terracotta transition-colors">
                          {o.order_number ?? o.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted tabular-nums">
                        {formatDate(o.order_date, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={STATUS_VARIANT[o.status] ?? 'muted'}>
                          {o.status === 'in_production' ? 'In Production' : o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-medium text-espresso">
                        {o.total ? formatTTD(o.total) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes display */}
          {customerData.notes && (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
              <h3 className="font-display font-semibold text-espresso mb-2">Notes</h3>
              <p className="text-sm text-espresso whitespace-pre-wrap">{customerData.notes}</p>
            </div>
          )}
        </div>

        {/* Right: edit form + messaging */}
        <div className="space-y-5">
          <CustomerEditForm customer={customerData} />
          <MessagingTemplates customer={customerData} />
        </div>
      </div>
    </PageWrapper>
  )
}
