'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AddEntryModal } from './AddEntryModal'

type LedgerEntry = {
  id: string
  entry_date: string
  type: string
  category: string | null
  description: string
  amount: number
}

interface Stats {
  income: number
  expenses: number
  net: number
}

export function LedgerClient({ entries, stats }: { entries: LedgerEntry[]; stats: Stats }) {
  const [filter,   setFilter]   = useState<'all' | 'income' | 'expense'>('all')
  const [addOpen,  setAddOpen]  = useState(false)

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Ledger</h2>
          <p className="text-sm text-muted mt-0.5">All income and expense transactions</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add Entry</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-status-green">{formatTTD(stats.income)}</p>
          <p className="text-xs text-muted mt-0.5">Total Income</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-status-red">{formatTTD(stats.expenses)}</p>
          <p className="text-xs text-muted mt-0.5">Total Expenses</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          stats.net >= 0 ? 'bg-cream border-cream/60' : 'bg-status-red/5 border-status-red/20'
        )}>
          <p className={cn('font-display text-xl font-semibold', stats.net >= 0 ? 'text-espresso' : 'text-status-red')}>
            {formatTTD(stats.net)}
          </p>
          <p className="text-xs text-muted mt-0.5">Net</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
              filter === t ? 'bg-espresso text-cream' : 'text-muted hover:text-espresso'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
          <p className="text-muted text-sm">No entries yet.</p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus size={16} />Add First Entry</Button>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-espresso/5 transition-colors">
                    <td className="px-5 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                      {formatDate(e.entry_date, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs font-medium capitalize px-2 py-0.5 rounded-full',
                        e.type === 'income' ? 'bg-status-green/10 text-status-green' : 'bg-status-red/10 text-status-red'
                      )}>
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted capitalize">
                      {e.category?.replace(/-/g, ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-espresso">{e.description}</td>
                    <td className={cn('px-5 py-3 text-right tabular-nums font-medium', e.type === 'income' ? 'text-status-green' : 'text-status-red')}>
                      {e.type === 'expense' ? '−' : '+'}{formatTTD(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addOpen && <AddEntryModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
