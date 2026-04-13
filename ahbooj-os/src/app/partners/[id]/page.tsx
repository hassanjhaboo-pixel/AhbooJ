import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatTTD, formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { PartnerEditForm } from './_components/PartnerEditForm'
import { PartnerOrdersTable } from './_components/PartnerOrdersTable'

type PartnerDetail = {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  payment_terms: string
  notes: string | null
  is_active: boolean
  created_at: string
}

type PartnerOrder = {
  id: string
  invoice_number: string | null
  order_date: string
  delivery_date: string | null
  due_date: string | null
  status: string
  total: number | null
  notes: string | null
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: partnerData } = await supabase
    .from('partners')
    .select('id, name, contact_name, phone, email, address, payment_terms, notes, is_active, created_at')
    .eq('id', id)
    .maybeSingle() as unknown as { data: PartnerDetail | null }

  if (!partnerData) notFound()

  const { data: orderData } = await supabase
    .from('partner_orders')
    .select('id, invoice_number, order_date, delivery_date, due_date, status, total, notes')
    .eq('partner_id', id)
    .order('order_date', { ascending: false })
    .limit(50) as unknown as { data: PartnerOrder[] | null }

  const orders = orderData ?? []

  const openOrders = orders.filter(o => !['paid', 'cancelled'].includes(o.status))
  const outstanding = openOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total ?? 0), 0)

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Partners
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-display text-2xl font-semibold text-espresso">{partnerData.name}</h2>
            <Badge variant="muted">{partnerData.payment_terms}</Badge>
            {!partnerData.is_active && <Badge variant="red">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            {partnerData.contact_name && <span className="font-medium text-espresso">{partnerData.contact_name}</span>}
            {partnerData.phone && <span>{partnerData.phone}</span>}
            {partnerData.email && <span>{partnerData.email}</span>}
            {partnerData.address && <span>{partnerData.address}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right space-y-0.5">
            <p className="text-xs text-muted">Partner since</p>
            <p className="text-sm text-espresso">{formatDate(partnerData.created_at, 'MMM yyyy')}</p>
          </div>
          <Link
            href={`/partners/orders/new?partnerId=${id}`}
            className="inline-flex items-center gap-1.5 bg-terracotta text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors"
          >
            <Plus size={15} />
            New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{orders.filter(o => o.status !== 'cancelled').length}</p>
          <p className="text-xs text-muted mt-0.5">Total Orders</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-espresso">
            {totalRevenue > 0 ? formatTTD(totalRevenue) : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Total Revenue</p>
        </div>
        <div className={outstanding > 0
          ? 'bg-terracotta/10 border border-terracotta/30 rounded-card shadow-card p-4 text-center'
          : 'bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center'
        }>
          <p className={`font-display text-xl font-semibold ${outstanding > 0 ? 'text-terracotta' : 'text-espresso'}`}>
            {outstanding > 0 ? formatTTD(outstanding) : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Outstanding</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center justify-between">
              <h3 className="font-display font-semibold text-espresso text-sm">Order History</h3>
              <span className="text-xs text-muted">({orders.length})</span>
            </div>
            <PartnerOrdersTable orders={orders} partnerId={id} />
          </div>
        </div>

        <div>
          <PartnerEditForm partner={partnerData} />
        </div>
      </div>
    </PageWrapper>
  )
}
