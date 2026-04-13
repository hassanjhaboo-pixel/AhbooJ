import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { LedgerClient } from './_components/LedgerClient'

type LedgerEntry = {
  id: string
  entry_date: string
  type: string
  category: string | null
  description: string
  amount: number
}

export default async function LedgerPage() {
  const supabase = await createClient()

  const { data: ledgerData } = await supabase
    .from('ledger')
    .select('id, entry_date, type, category, description, amount')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200) as unknown as { data: LedgerEntry[] | null }

  const entries = ledgerData ?? []

  const income   = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

  return (
    <PageWrapper>
      <LedgerClient
        entries={entries}
        stats={{ income, expenses, net: income - expenses }}
      />
    </PageWrapper>
  )
}
