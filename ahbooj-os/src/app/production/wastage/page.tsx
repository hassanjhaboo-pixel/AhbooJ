import Link from 'next/link'
import { ChevronLeft, Trash } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { WastageClient } from './_components/WastageClient'

export default async function WastagePage() {
  const supabase = await createClient()

  const [entriesRes, ingredientsRes, batchesRes] = await Promise.all([
    supabase
      .from('wastage_log')
      .select('id, waste_date, quantity_wasted, unit, estimated_cost, reason, notes, ingredients(name), production_batches(batch_number)')
      .order('waste_date', { ascending: false })
      .limit(100),
    supabase
      .from('ingredients')
      .select('id, name, unit, cost_per_unit')
      .order('name'),
    supabase
      .from('production_batches')
      .select('id, batch_number')
      .order('production_date', { ascending: false })
      .limit(50),
  ])

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/production" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Production
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Trash className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-espresso">Wastage Log</h1>
          <p className="text-sm text-muted">Track ingredients wasted per batch or general spoilage</p>
        </div>
      </div>

      <WastageClient
        entries={(entriesRes.data ?? []) as unknown as Parameters<typeof WastageClient>[0]['entries']}
        ingredients={(ingredientsRes.data ?? []) as unknown as Parameters<typeof WastageClient>[0]['ingredients']}
        batches={(batchesRes.data ?? []) as unknown as Parameters<typeof WastageClient>[0]['batches']}
      />
    </PageWrapper>
  )
}
