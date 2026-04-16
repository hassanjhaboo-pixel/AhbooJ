import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'

type PendingOrder = {
  id: string
  order_number: string | null
  order_date: string
  status: string
  total: number | null
  customers: { name: string }[] | null
}

const STATUS_VARIANT: Record<string, 'amber' | 'terracotta' | 'gold' | 'green'> = {
  draft:         'muted' as 'amber',
  pending:       'amber',
  confirmed:     'terracotta',
  in_production: 'gold',
  ready:         'green',
  dispatched:    'green',
}

const STATUS_LABEL: Record<string, string> = {
  draft:         'Draft',
  pending:       'Pending',
  confirmed:     'Confirmed',
  in_production: 'In Production',
  ready:         'Ready',
  dispatched:    'Dispatched',
}

export function PendingOrdersCard({ orders }: { orders: PendingOrder[] }) {
  const totalValue = orders.reduce((s, o) => s + (o.total ?? 0), 0)

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-terracotta" />
          <h3 className="font-display font-semibold text-espresso text-sm">Pending Orders</h3>
        </div>
        <span className="text-xs text-muted">{orders.length} active</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">No pending orders.</p>
      ) : (
        <>
          <div className="px-5 py-3 border-b border-espresso/5 bg-espresso/[0.02]">
            <p className="text-xs text-muted">Combined value</p>
            <p className="font-display text-xl font-bold text-espresso">{formatTTD(totalValue)}</p>
          </div>
          <div className="divide-y divide-espresso/5">
            {orders.slice(0, 6).map(order => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-espresso/[0.03] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-espresso">
                    {order.customers?.[0]?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted">
                    {order.order_number ?? '—'} · {formatDate(order.order_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[order.status] ?? 'amber'} className="text-xs">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                  <span className="text-sm font-semibold text-espresso">{formatTTD(order.total ?? 0)}</span>
                </div>
              </Link>
            ))}
            {orders.length > 6 && (
              <div className="px-5 py-3 text-center">
                <Link href="/orders" className="text-xs text-terracotta hover:underline">
                  +{orders.length - 6} more — View all
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
