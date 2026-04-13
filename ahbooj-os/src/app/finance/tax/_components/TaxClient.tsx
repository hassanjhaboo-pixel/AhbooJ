'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { AddTaxModal } from './AddTaxModal'

type TaxEntry = {
  id: string
  entry_date: string
  category: string | null
  description: string | null
  amount: number | null
  reference: string | null
}

type CategoryTotal = { category: string; total: number }

export function TaxClient({ entries, categoryTotals }: { entries: TaxEntry[]; categoryTotals: CategoryTotal[] }) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Tax</h2>
          <p className="text-sm text-muted mt-0.5">VAT, income tax, and compliance records</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add Entry</Button>
      </div>

      {/* Category summary */}
      {categoryTotals.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {categoryTotals.map(ct => (
            <div key={ct.category} className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
              <p className="font-display text-lg font-semibold text-espresso">{formatTTD(ct.total)}</p>
              <p className="text-xs text-muted mt-0.5 capitalize">{ct.category.replace(/-/g, ' ')}</p>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
          <p className="text-muted text-sm mb-4">No tax entries yet.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add First Entry</Button>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/10 bg-espresso/5">
                <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Reference</th>
                <th className="text-right px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-espresso/5 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                    {formatDate(e.entry_date, 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">
                    {e.category?.replace(/-/g, ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-espresso">{e.description ?? '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted">{e.reference ?? '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-espresso">
                    {e.amount != null ? formatTTD(e.amount) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && <AddTaxModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
