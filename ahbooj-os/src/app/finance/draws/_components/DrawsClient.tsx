'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddDrawModal } from './AddDrawModal'

type Draw = {
  id: string
  draw_date: string
  amount: number
  approved: boolean
  rule_check_passed: boolean | null
  notes: string | null
}

export function DrawsClient({ draws, totalYTD }: { draws: Draw[]; totalYTD: number }) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Owner Draws</h2>
          <p className="text-sm text-muted mt-0.5">Hassan's personal draws from the business</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Log Draw</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{draws.length}</p>
          <p className="text-xs text-muted mt-0.5">Total Draws</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-xl font-semibold text-espresso">{totalYTD > 0 ? formatTTD(totalYTD) : '—'}</p>
          <p className="text-xs text-muted mt-0.5">Total Drawn</p>
        </div>
      </div>

      {draws.length === 0 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
          <p className="text-muted text-sm mb-4">No draws recorded yet.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} />Log First Draw</Button>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/10 bg-espresso/5">
                <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {draws.map(d => (
                <tr key={d.id} className="hover:bg-espresso/5 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                    {formatDate(d.draw_date, 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                    {formatTTD(d.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.approved ? 'green' : 'amber'}>{d.approved ? 'Approved' : 'Pending'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{d.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && <AddDrawModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
