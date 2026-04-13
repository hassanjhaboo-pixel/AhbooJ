import Link from 'next/link'
import { BookOpen, TrendingDown, Wallet, ShieldCheck, Receipt, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatTTD, formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { cn } from '@/lib/utils'

type LedgerEntry = {
  id: string
  entry_date: string
  type: string
  category: string | null
  description: string
  amount: number
}

type Draw = { amount: number }

type Reserve = {
  snapshot_date: string
  total_cash: number | null
  reserve_weeks_covered: number | null
}

const NAV_CARDS = [
  { href: '/finance/ledger',    label: 'Ledger',         description: 'All income & expenses',       icon: BookOpen },
  { href: '/finance/draws',     label: 'Owner Draws',    description: 'Personal draw history',        icon: Wallet },
  { href: '/finance/reserves',  label: 'Reserves',       description: 'Cash position snapshots',      icon: ShieldCheck },
  { href: '/finance/tax',       label: 'Tax',            description: 'VAT, income tax, compliance',  icon: Receipt },
  { href: '/finance/suppliers', label: 'Suppliers',      description: 'Vendor accounts & payments',   icon: Truck },
]

export default async function FinancePage() {
  const supabase = await createClient()

  // Current month bounds
  const now      = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: ledgerData } = await supabase
    .from('ledger')
    .select('id, entry_date, type, category, description, amount')
    .gte('entry_date', monthStart)
    .order('entry_date', { ascending: false }) as unknown as { data: LedgerEntry[] | null }

  const { data: recentData } = await supabase
    .from('ledger')
    .select('id, entry_date, type, category, description, amount')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8) as unknown as { data: LedgerEntry[] | null }

  const { data: drawData } = await supabase
    .from('owner_draws')
    .select('amount') as unknown as { data: Draw[] | null }

  const { data: reserveData } = await supabase
    .from('reserves')
    .select('snapshot_date, total_cash, reserve_weeks_covered')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as { data: Reserve | null }

  const mtdEntries = ledgerData ?? []
  const recent     = recentData ?? []

  const mtdIncome   = mtdEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const mtdExpenses = mtdEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const mtdNet      = mtdIncome - mtdExpenses
  const totalDraws  = (drawData ?? []).reduce((s, d) => s + d.amount, 0)

  const monthLabel = now.toLocaleString('en-TT', { month: 'long', year: 'numeric' })

  return (
    <PageWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">Finance</h2>
        <p className="text-sm text-muted mt-0.5">{monthLabel} overview</p>
      </div>

      {/* MTD stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-status-green">{formatTTD(mtdIncome)}</p>
          <p className="text-xs text-muted mt-0.5">MTD Income</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-status-red">{formatTTD(mtdExpenses)}</p>
          <p className="text-xs text-muted mt-0.5">MTD Expenses</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          mtdNet >= 0 ? 'bg-cream border-cream/60' : 'bg-status-red/5 border-status-red/20'
        )}>
          <p className={cn('font-display text-xl font-semibold', mtdNet >= 0 ? 'text-espresso' : 'text-status-red')}>
            {formatTTD(mtdNet)}
          </p>
          <p className="text-xs text-muted mt-0.5">Net Profit</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-espresso">{totalDraws > 0 ? formatTTD(totalDraws) : '—'}</p>
          <p className="text-xs text-muted mt-0.5">Total Draws</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: recent entries */}
        <div className="lg:col-span-2 space-y-5">
          {/* Reserve snapshot */}
          {reserveData && (
            <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-espresso text-sm">Latest Reserve Snapshot</h3>
                <Link href="/finance/reserves" className="text-xs text-terracotta hover:underline">View all →</Link>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="font-display text-2xl font-semibold text-espresso">
                    {reserveData.total_cash != null ? formatTTD(reserveData.total_cash) : '—'}
                  </p>
                  <p className="text-xs text-muted">Total Cash</p>
                </div>
                <div>
                  <p className={cn(
                    'font-display text-2xl font-semibold',
                    reserveData.reserve_weeks_covered != null && reserveData.reserve_weeks_covered >= 8
                      ? 'text-status-green'
                      : reserveData.reserve_weeks_covered != null && reserveData.reserve_weeks_covered >= 4
                      ? 'text-status-amber'
                      : 'text-status-red'
                  )}>
                    {reserveData.reserve_weeks_covered != null ? `${reserveData.reserve_weeks_covered}w` : '—'}
                  </p>
                  <p className="text-xs text-muted">Weeks Covered</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted">{formatDate(reserveData.snapshot_date, 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent entries */}
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center justify-between">
              <h3 className="font-display font-semibold text-espresso text-sm">Recent Transactions</h3>
              <Link href="/finance/ledger" className="text-xs text-terracotta hover:underline">Full ledger →</Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted">No transactions yet.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-espresso/5">
                  {recent.map(e => (
                    <tr key={e.id} className="hover:bg-espresso/5 transition-colors">
                      <td className="px-5 py-2.5 text-xs text-muted tabular-nums whitespace-nowrap">
                        {formatDate(e.entry_date, 'MMM d')}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'text-xs font-medium capitalize px-1.5 py-0.5 rounded-full',
                          e.type === 'income' ? 'bg-status-green/10 text-status-green' : 'bg-status-red/10 text-status-red'
                        )}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-espresso">{e.description}</td>
                      <td className={cn('px-5 py-2.5 text-right tabular-nums font-medium text-xs', e.type === 'income' ? 'text-status-green' : 'text-status-red')}>
                        {e.type === 'expense' ? '−' : '+'}{formatTTD(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: nav cards */}
        <div className="space-y-3">
          {NAV_CARDS.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-cream rounded-card shadow-card border border-cream/60 p-4 hover:border-terracotta/30 hover:shadow-md transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-espresso/5 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-muted" />
              </div>
              <div>
                <p className="font-medium text-espresso text-sm">{label}</p>
                <p className="text-xs text-muted">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
