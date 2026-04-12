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
  is_active: boolean
}

export default async function CRMPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, email, instagram_handle, channel, on_whatsapp_list, on_email_list, total_orders, total_spend, last_order_date, is_active')
    .order('name') as unknown as { data: Customer[] | null; error: { message: string } | null }

  const customers = data ?? []

  return (
    <PageWrapper>
      <CRMClient
        customers={customers}
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
