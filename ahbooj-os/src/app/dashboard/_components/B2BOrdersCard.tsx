import Link from 'next/link'
import { formatTTD, formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'

interface B2BOrder {
  id: string
  invoice_number: string | null
  status: string
  total: number | null
  due_date: string | null
  order_date: string
  partners: { name: string } | null
}

interface B2BOrdersCardProps {
  orders: B2BOrder[]
}

const statusStyles: Record<string, string> = {
  pending:   'bg-status-amber/15 text-amber-700 border-status-amber/30',
  delivered: 'bg-gold/15 text-amber-800 border-gold/30',
  invoiced:  'bg-terracotta/15 text-terracotta border-terracotta/30',
  overdue:   'bg-status-red/15 text-status-red border-status-red/30',
  paid:      'bg-status-green/15 text-status-green border-status-green/30',
}

export function B2BOrdersCard({ orders }: B2BOrdersCardProps) {
  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-espresso">B2B Orders</h3>
        <Link href="/partners" className="text-xs text-terracotta hover:underline">
          View all →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted">No active B2B orders</p>
          <Link href="/partners/orders/new" className="text-xs text-terracotta hover:underline mt-1 inline-block">
            Create partner order →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.slice(0, 5).map(order => (
            <li key={order.id} className="flex items-center justify-between py-2 border-b border-espresso/5 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-espresso truncate">
                  {order.partners?.name ?? 'Partner'}
                </p>
                <p className="text-xs text-muted">
                  {order.invoice_number ?? formatDate(order.order_date)}
                  {order.due_date && ` · Due ${formatDate(order.due_date, 'MMM d')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {order.total && (
                  <span className="text-sm font-medium text-espresso">
                    {formatTTD(order.total)}
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border capitalize',
                  statusStyles[order.status] ?? statusStyles['pending']
                )}>
                  {order.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
