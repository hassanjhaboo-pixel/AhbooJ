import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SuppliersClient } from './_components/SuppliersClient'

type Supplier = {
  id: string
  name: string
  category: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  payment_terms: string | null
  is_active: boolean
}

type Payment = {
  id: string
  supplier_id: string | null
  amount: number
  description: string | null
  due_date: string | null
  paid_date: string | null
  status: string
  suppliers: { name: string }[] | null
}

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: supplierData } = await supabase
    .from('suppliers')
    .select('id, name, category, contact_name, phone, email, payment_terms, is_active')
    .order('name') as unknown as { data: Supplier[] | null }

  const { data: paymentData } = await supabase
    .from('supplier_payments')
    .select('id, supplier_id, amount, description, due_date, paid_date, status, suppliers(name)')
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false }) as unknown as { data: Payment[] | null }

  return (
    <PageWrapper>
      <SuppliersClient
        suppliers={supplierData ?? []}
        payments={paymentData ?? []}
      />
    </PageWrapper>
  )
}
