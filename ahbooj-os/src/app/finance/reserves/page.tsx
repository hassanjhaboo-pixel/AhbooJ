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
      <ReservesClient reserves={reserveData ?? []} />
    </PageWrapper>
  )
}
