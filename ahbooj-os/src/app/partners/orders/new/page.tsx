import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PartnerOrderForm } from './_components/PartnerOrderForm'

type Partner = {
  id: string
  name: string
  payment_terms: string
}

type Product = {
  id: string
  name: string
  sku: string | null
  cafe_price: number | null
  direct_price: number | null
}

export default async function NewPartnerOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ partnerId?: string }>
}) {
  const { partnerId } = await searchParams
  const supabase = await createClient()

  const { data: partnerData } = await supabase
    .from('partners')
    .select('id, name, payment_terms')
    .eq('is_active', true)
    .order('name') as unknown as { data: Partner[] | null }

  const { data: productData } = await supabase
    .from('products')
    .select('id, name, sku, cafe_price, direct_price')
    .eq('is_active', true)
    .order('name') as unknown as { data: Product[] | null }

  const partners = partnerData ?? []
  const products = productData ?? []

  return (
    <PageWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">New Partner Order</h2>
        <p className="text-sm text-muted mt-0.5">Create a B2B wholesale order and generate an invoice</p>
      </div>

      <PartnerOrderForm
        partners={partners}
        products={products}
        defaultPartnerId={partnerId ?? ''}
      />
    </PageWrapper>
  )
}
