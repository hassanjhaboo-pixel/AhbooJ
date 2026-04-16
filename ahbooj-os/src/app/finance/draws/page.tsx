import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DrawsClient } from './_components/DrawsClient'

type Draw = {
  id: string
  draw_date: string
  amount: number
  approved: boolean
  rule_check_passed: boolean | null
  notes: string | null
}

export default async function DrawsPage() {
  const supabase = await createClient()

  const { data: drawData } = await supabase
    .from('owner_draws')
    .select('id, draw_date, amount, approved, rule_check_passed, notes')
    .order('draw_date', { ascending: false }) as unknown as { data: Draw[] | null }

  const draws    = drawData ?? []
  const totalYTD = draws.reduce((s, d) => s + d.amount, 0)

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Finance
        </Link>
      </div>
      <DrawsClient draws={draws} totalYTD={totalYTD} />
    </PageWrapper>
  )
}
