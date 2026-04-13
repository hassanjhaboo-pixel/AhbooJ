'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type PartnerOrder = {
  id: string
  invoice_number: string | null
  order_date: string
  delivery_date: string | null
  due_date: string | null
  status: string
  total: number | null
  notes: string | null
}

const STATUS_FLOW = ['pending', 'confirmed', 'delivered', 'invoiced', 'paid'] as const
type OrderStatus = typeof STATUS_FLOW[number]

const STATUS_VARIANT: Record<string, 'amber' | 'terracotta' | 'gold' | 'green' | 'muted' | 'red'> = {
  pending:   'amber',
  confirmed: 'terracotta',
  delivered: 'gold',
  invoiced:  'green',
  paid:      'muted',
  cancelled: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  invoiced:  'Invoiced',
  paid:      'Paid',
  cancelled: 'Cancelled',
}

function nextStatus(status: string): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(status as OrderStatus)
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

export function PartnerOrdersTable({ orders, partnerId }: { orders: PartnerOrder[]; partnerId: string }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  async function advance(orderId: string, to: string) {
    setUpdating(orderId)
    const supabase = createClient()
    const patch: Record<string, string> = { status: to }
    if (to === 'paid') patch.paid_date = new Date().toISOString().split('T')[0]
    await supabase.from('partner_orders').update(patch).eq('id', orderId)
    router.refresh()
    setUpdating(null)
  }

  async function cancel(orderId: string) {
    setUpdating(orderId)
    const supabase = createClient()
    await supabase.from('partner_orders').update({ status: 'cancelled' }).eq('id', orderId)
    router.refresh()
    setUpdating(null)
  }

  if (orders.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted">No orders yet</p>
        <Link href={`/partners/orders/new?partnerId=${partnerId}`} className="text-xs text-terracotta hover:underline mt-1 inline-block">
          Create first order →
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-espresso/10 bg-espresso/5">
            <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Invoice</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Due</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
            <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Total</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-espresso/5">
          {orders.map(o => {
            const next = nextStatus(o.status)
            const isUpdating = updating === o.id
            const isTerminal = o.status === 'paid' || o.status === 'cancelled'
            return (
              <tr key={o.id} className={cn('hover:bg-espresso/5 transition-colors', isTerminal && 'opacity-60')}>
                <td className="px-5 py-3 font-mono text-xs text-espresso">
                  {o.invoice_number ?? o.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-4 py-3 text-xs text-muted tabular-nums">
                  {formatDate(o.order_date, 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums">
                  {o.due_date
                    ? <span className={cn(o.status !== 'paid' && o.status !== 'cancelled' && new Date(o.due_date) < new Date() ? 'text-status-red font-medium' : 'text-muted')}>
                        {formatDate(o.due_date, 'MMM d')}
                      </span>
                    : <span className="text-muted">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[o.status] ?? 'muted'}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                  {o.total ? formatTTD(o.total) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs space-x-3 whitespace-nowrap">
                  {next && !isTerminal && (
                    <button
                      onClick={() => advance(o.id, next)}
                      disabled={isUpdating}
                      className="text-terracotta hover:underline disabled:opacity-50"
                    >
                      {isUpdating ? '…' : `Mark ${STATUS_LABEL[next]} →`}
                    </button>
                  )}
                  {!isTerminal && (
                    <button
                      onClick={() => cancel(o.id)}
                      disabled={isUpdating}
                      className="text-muted hover:text-status-red disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
