import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PartnersClient } from './_components/PartnersClient'

type Partner = {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  payment_terms: string
  is_active: boolean
  notes: string | null
}

type PartnerOrderSummary = {
  partner_id: string | null
  status: string
  total: number | null
  order_date: string
}

export default async function PartnersPage() {
  const supabase = await createClient()

  const { data: partnerData, error } = await supabase
    .from('partners')
    .select('id, name, contact_name, phone, email, payment_terms, is_active, notes')
    .order('name') as unknown as { data: Partner[] | null; error: { message: string } | null }

  const { data: orderData } = await supabase
    .from('partner_orders')
    .select('partner_id, status, total, order_date')
    .not('status', 'in', '("paid","cancelled")') as unknown as { data: PartnerOrderSummary[] | null }

  const partners = partnerData ?? []
  const openOrders = orderData ?? []

  // Build per-partner summary
  const partnerSummary = partners.map(p => {
    const pOrders   = openOrders.filter(o => o.partner_id === p.id)
    const outstanding = pOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    return { ...p, openOrderCount: pOrders.length, outstanding }
  })

  const totalOutstanding = openOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)

  return (
    <PageWrapper>
      <PartnersClient
        partners={partnerSummary}
        stats={{
          total:       partners.length,
          active:      partners.filter(p => p.is_active).length,
          openOrders:  openOrders.length,
          outstanding: totalOutstanding,
        }}
        error={error?.message}
      />
    </PageWrapper>
  )
}
