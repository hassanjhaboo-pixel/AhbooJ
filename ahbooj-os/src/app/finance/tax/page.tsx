import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TaxClient } from './_components/TaxClient'

type TaxEntry = {
  id: string
  entry_date: string
  category: string | null
  description: string | null
  amount: number | null
  reference: string | null
}

export default async function TaxPage() {
  const supabase = await createClient()

  const { data: taxData } = await supabase
    .from('tax_entries')
    .select('id, entry_date, category, description, amount, reference')
    .order('entry_date', { ascending: false }) as unknown as { data: TaxEntry[] | null }

  const entries = taxData ?? []

  // Group totals by category
  const catMap = new Map<string, number>()
  for (const e of entries) {
    if (e.amount == null) continue
    const cat = e.category ?? 'other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + e.amount)
  }
  const categoryTotals = Array.from(catMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Finance
        </Link>
      </div>
      <TaxClient entries={entries} categoryTotals={categoryTotals} />
    </PageWrapper>
  )
}
