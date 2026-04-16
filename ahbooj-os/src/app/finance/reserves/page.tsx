import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ReservesClient } from './_components/ReservesClient'

type Reserve = {
  id: string
  snapshot_date: string
  total_cash: number | null
  operating_reserve: number | null
  personal_float: number | null
  reserve_weeks_covered: number | null
  notes: string | null
}

export default async function ReservesPage() {
  const supabase = await createClient()

  const { data: reserveData } = await supabase
    .from('reserves')
    .select('id, snapshot_date, total_cash, operating_reserve, personal_float, reserve_weeks_covered, notes')
    .order('snapshot_date', { ascending: false }) as unknown as { data: Reserve[] | null }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Finance
        </Link>
      </div>
      <ReservesClient reserves={reserveData ?? []} />
    </PageWrapper>
  )
}
