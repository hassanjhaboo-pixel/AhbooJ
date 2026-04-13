'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { formatTTD } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AddPartnerModal } from './AddPartnerModal'

interface PartnerRow {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  payment_terms: string
  is_active: boolean
  openOrderCount: number
  outstanding: number
}

interface Stats {
  total: number
  active: number
  openOrders: number
  outstanding: number
}

export function PartnersClient({
  partners,
  stats,
  error,
}: {
  partners: PartnerRow[]
  stats: Stats
  error?: string
}) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Partners</h2>
          <p className="text-sm text-muted mt-0.5">B2B wholesale accounts</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add Partner</Button>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load partners. Ensure the database schema has been applied.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{stats.active}</p>
          <p className="text-xs text-muted mt-0.5">Active Partners</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          stats.openOrders > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', stats.openOrders > 0 ? 'text-amber-700' : 'text-espresso')}>
            {stats.openOrders}
          </p>
          <p className="text-xs text-muted mt-0.5">Open Orders</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          stats.outstanding > 0 ? 'bg-terracotta/10 border-terracotta/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-xl font-semibold', stats.outstanding > 0 ? 'text-terracotta' : 'text-espresso')}>
            {stats.outstanding > 0 ? formatTTD(stats.outstanding) : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Outstanding</p>
        </div>
      </div>

      {partners.length === 0 && !error ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <Building2 size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No partners yet</h3>
          <p className="text-muted text-sm mb-5">Add your first wholesale partner to start managing B2B orders.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add First Partner</Button>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Partner</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Terms</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Open Orders</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Outstanding</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {partners.map(p => (
                  <tr key={p.id} className={cn('hover:bg-espresso/5 transition-colors', !p.is_active && 'opacity-50')}>
                    <td className="px-5 py-3">
                      <Link href={`/partners/${p.id}`} className="font-medium text-espresso hover:text-terracotta transition-colors">
                        {p.name}
                      </Link>
                      {!p.is_active && <span className="ml-2 text-xs text-muted">(inactive)</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted space-y-0.5">
                      {p.contact_name && <p className="font-medium text-espresso">{p.contact_name}</p>}
                      {p.phone && <p>{p.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{p.payment_terms}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.openOrderCount > 0
                        ? <span className="font-medium text-amber-700">{p.openOrderCount}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {p.outstanding > 0
                        ? <span className="text-terracotta">{formatTTD(p.outstanding)}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/partners/orders/new?partnerId=${p.id}`}
                        className="text-xs text-terracotta hover:underline whitespace-nowrap"
                      >
                        New order →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addOpen && <AddPartnerModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
