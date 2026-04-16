import Link from 'next/link'
import { ChevronLeft, FileDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MonthlyReportDownload } from './_components/MonthlyReportPDF'

export default async function ReportPage() {
  const supabase = await createClient()
  const now = new Date()

  // Last 3 months options — default to current month
  const months = [now, subMonths(now, 1), subMonths(now, 2)]

  // Fetch data for current month by default
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const monthLabel = format(now, 'MMMM yyyy')

  const [ledgerRes, drawsRes] = await Promise.all([
    supabase
      .from('ledger')
      .select('entry_date, type, category, description, amount')
      .gte('entry_date', monthStart)
      .lte('entry_date', monthEnd)
      .order('entry_date', { ascending: false })
      .limit(200),
    supabase
      .from('owner_draws')
      .select('amount')
      .gte('draw_date', monthStart)
      .lte('draw_date', monthEnd),
  ])

  const entries = (ledgerRes.data ?? []) as Array<{
    entry_date: string; type: string; category: string | null;
    description: string; amount: number
  }>

  const income   = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const draws    = (drawsRes.data ?? []).reduce((s: number, d: { amount: number }) => s + d.amount, 0)

  const reportData = {
    monthLabel,
    income,
    expenses,
    net: income - expenses,
    draws,
    entries,
    generatedAt: format(now, 'MMM d, yyyy h:mm a'),
  }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Finance
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
          <FileDown className="w-5 h-5 text-terracotta" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-espresso">Monthly Report</h1>
          <p className="text-sm text-muted">Download a PDF summary for {monthLabel}</p>
        </div>
      </div>

      <div className="max-w-xl">
        {/* Summary */}
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-6 mb-5">
          <h2 className="font-display font-semibold text-espresso mb-4">{monthLabel} Summary</h2>
          <div className="space-y-2">
            {[
              { label: 'Total Income', value: reportData.income, colour: 'text-status-green' },
              { label: 'Total Expenses', value: reportData.expenses, colour: 'text-status-red' },
              { label: 'Net', value: reportData.net, colour: reportData.net >= 0 ? 'text-status-green' : 'text-status-red' },
              { label: 'Owner Draws', value: reportData.draws, colour: 'text-terracotta' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-espresso/5 last:border-0">
                <span className="text-sm text-muted">{s.label}</span>
                <span className={`font-semibold ${s.colour}`}>
                  TT${s.value.toLocaleString('en-TT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-espresso/10">
            <p className="text-xs text-muted mb-3">{entries.length} ledger entries in period</p>
            <MonthlyReportDownload data={reportData} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
