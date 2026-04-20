import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CRMClient } from './_components/CRMClient'

type Customer = {
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
  updated_at?: string | null
  is_active: boolean
  referred_by: string | null
  referral_count: number
  birthday_month: number | null
  birthday_day: number | null
}

export default async function CRMPage() {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, email, instagram_handle, channel, on_whatsapp_list, on_email_list, total_orders, total_spend, last_order_date, updated_at, is_active, referred_by, referral_count, birthday_month, birthday_day')
    .order('name') as unknown as { data: Customer[] | null; error: { message: string } | null }

  if (error?.message?.toLowerCase().includes('updated_at')) {
    const fb = await supabase
      .from('customers')
      .select('id, name, phone, email, instagram_handle, channel, on_whatsapp_list, on_email_list, total_orders, total_spend, last_order_date, is_active, referred_by, referral_count, birthday_month, birthday_day')
      .order('name') as unknown as { data: Customer[] | null; error: { message: string } | null }
    data = fb.data?.map(c => ({ ...c, updated_at: null })) ?? null
    error = fb.error
  }

  const customers = data ?? []

  // Build referral leaderboard
  const referrers = customers
    .filter(c => (c.referral_count ?? 0) > 0)
    .sort((a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0))
    .map(referrer => ({
      id: referrer.id,
      name: referrer.name,
      referral_count: referrer.referral_count ?? 0,
      total_spend: referrer.total_spend,
      referred_customers: customers
        .filter(c => c.referred_by === referrer.id)
        .map(c => ({ id: c.id, name: c.name, total_spend: c.total_spend })),
    }))

  return (
    <PageWrapper>
      <CRMClient
        customers={customers}
        referrers={referrers}
        stats={{
          total:    customers.length,
          active:   customers.filter(c => c.is_active).length,
          whatsapp: customers.filter(c => c.on_whatsapp_list).length,
          email:    customers.filter(c => c.on_email_list).length,
        }}
        error={error?.message}
      />
    </PageWrapper>
  )
}
