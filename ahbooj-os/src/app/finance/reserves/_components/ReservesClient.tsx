'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AddReserveModal } from './AddReserveModal'

type Reserve = {
  id: string
  snapshot_date: string
  total_cash: number | null
  operating_reserve: number | null
  personal_float: number | null
  reserve_weeks_covered: number | null
  notes: string | null
}

export function ReservesClient({ reserves }: { reserves: Reserve[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const latest   = reserves[0] ?? null

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Reserves</h2>
          <p className="text-sm text-muted mt-0.5">Cash position and reserve fund snapshots</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Log Snapshot</Button>
      </div>

      {/* Latest snapshot */}
      {latest && (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-espresso">Latest Snapshot</h3>
            <span className="text-xs text-muted">{formatDate(latest.snapshot_date, 'MMM d, yyyy')}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="font-display text-xl font-semibold text-espresso">
                {latest.total_cash != null ? formatTTD(latest.total_cash) : '—'}
              </p>
              <p className="text-xs text-muted mt-0.5">Total Cash</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-semibold text-espresso">
                {latest.operating_reserve != null ? formatTTD(latest.operating_reserve) : '—'}
              </p>
              <p className="text-xs text-muted mt-0.5">Operating Reserve</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-semibold text-espresso">
                {latest.personal_float != null ? formatTTD(latest.personal_float) : '—'}
              </p>
              <p className="text-xs text-muted mt-0.5">Personal Float</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'font-display text-xl font-semibold',
                latest.reserve_weeks_covered != null && latest.reserve_weeks_covered >= 8
                  ? 'text-status-green'
                  : latest.reserve_weeks_covered != null && latest.reserve_weeks_covered >= 4
                  ? 'text-status-amber'
                  : 'text-status-red'
              )}>
                {latest.reserve_weeks_covered != null ? `${latest.reserve_weeks_covered}w` : '—'}
              </p>
              <p className="text-xs text-muted mt-0.5">Weeks Covered</p>
            </div>
          </div>
          {latest.notes && (
            <p className="text-xs text-muted mt-3 pt-3 border-t border-espresso/10">{latest.notes}</p>
          )}
        </div>
      )}

      {reserves.length === 0 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
          <p className="text-muted text-sm mb-4">No snapshots yet. Log your first cash position.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} />Log First Snapshot</Button>
        </div>
      ) : reserves.length > 1 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-espresso/10">
            <h3 className="font-display font-semibold text-espresso text-sm">History</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/10 bg-espresso/5">
                <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Total Cash</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Op. Reserve</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Float</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Weeks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {reserves.slice(1).map(r => (
                <tr key={r.id} className="hover:bg-espresso/5 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-muted tabular-nums">{formatDate(r.snapshot_date, 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-espresso">{r.total_cash != null ? formatTTD(r.total_cash) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{r.operating_reserve != null ? formatTTD(r.operating_reserve) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{r.personal_float != null ? formatTTD(r.personal_float) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{r.reserve_weeks_covered != null ? `${r.reserve_weeks_covered}w` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {addOpen && <AddReserveModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
