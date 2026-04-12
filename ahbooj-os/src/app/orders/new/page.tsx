import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { OrderForm } from './_components/OrderForm'

type CustomerRow = { id: string; name: string; phone: string | null }
type ProductRow  = { id: string; name: string; sku: string | null; direct_price: number | null; cafe_price: number | null }

export default async function NewOrderPage() {
  const supabase = await createClient()

  const { data: customerData } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('is_active', true)
    .order('name') as unknown as { data: CustomerRow[] | null }

  const { data: productData } = await supabase
    .from('products')
    .select('id, name, sku, direct_price, cafe_price')
    .eq('is_active', true)
    .order('name') as unknown as { data: ProductRow[] | null }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          All Orders
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">New Order</h2>
        <p className="text-sm text-muted mt-0.5">Log a direct customer order.</p>
      </div>
      <OrderForm customers={customerData ?? []} products={productData ?? []} />
    </PageWrapper>
  )
}
