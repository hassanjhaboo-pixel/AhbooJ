import Link from 'next/link'
import { Plus, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatTTD, formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Order = {
  id: string
  order_number: string | null
  order_date: string
  status: string
  channel: string | null
  total: number | null
  customers: { name: string }[] | null
}

const STATUS_LABEL: Record<string, string> = {
  draft:         'Draft',
  pending:       'Pending',
  confirmed:     'Confirmed',
  in_production: 'In Production',
  ready:         'Ready',
  dispatched:    'Dispatched',
  delivered:     'Delivered',
  cancelled:     'Cancelled',
}
const STATUS_VARIANT: Record<string, 'amber' | 'terracotta' | 'gold' | 'green' | 'muted' | 'red'> = {
  draft:         'muted',
  pending:       'amber',
  confirmed:     'terracotta',
  in_production: 'gold',
  ready:         'green',
  dispatched:    'green',
  delivered:     'muted',
  cancelled:     'red',
}

const PIPELINE = ['draft', 'pending', 'confirmed', 'in_production', 'ready', 'dispatched']

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, order_date, status, channel, total, customers(name)')
    .order('order_date', { ascending: false })
    .limit(100) as unknown as { data: Order[] | null; error: { message: string } | null }

  const orders = data ?? []

  const now = new Date()
  const monthPrefix = now.toISOString().slice(0, 7)       // 'YYYY-MM'
  const today = now.toISOString().split('T')[0]            // 'YYYY-MM-DD'

  const pendingCount   = orders.filter(o => PIPELINE.includes(o.status)).length
  const todayCount     = orders.filter(o => o.order_date === today).length
  const mtdRevenue     = orders
    .filter(o => o.status !== 'cancelled' && o.order_date.startsWith(monthPrefix))
    .reduce((sum, o) => sum + (o.total ?? 0), 0)

  // Group by active vs completed
  const active    = orders.filter(o => PIPELINE.includes(o.status))
  const completed = orders.filter(o => !PIPELINE.includes(o.status))

  function OrderTable({ rows, title }: { rows: Order[]; title: string }) {
    return (
      <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-espresso/10 bg-espresso/5">
          <h3 className="font-display font-semibold text-espresso text-sm">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/10">
                <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Channel</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {rows.map(o => (
                <tr key={o.id} className={cn(
                  'hover:bg-espresso/5 transition-colors',
                  o.status === 'cancelled' && 'opacity-50'
                )}>
                  <td className="px-5 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium text-espresso hover:text-terracotta transition-colors font-mono text-xs">
                      {o.order_number ?? o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-espresso">
                    {o.customers?.[0]?.name ?? <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {o.channel
                      ? <span className="text-xs text-muted capitalize">{o.channel.replace('_', ' ')}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs tabular-nums">
                    {formatDate(o.order_date, 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[o.status] ?? 'muted'}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-espresso">
                    {o.total ? formatTTD(o.total) : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Orders</h2>
          <p className="text-sm text-muted mt-0.5">{orders.length} total orders</p>
        </div>
        <Link href="/orders/new">
          <Button><Plus size={16} />New Order</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load orders. Ensure the database schema has been applied.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          pendingCount > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', pendingCount > 0 ? 'text-amber-700' : 'text-espresso')}>
            {pendingCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Active Orders</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{todayCount}</p>
          <p className="text-xs text-muted mt-0.5">Orders Today</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{formatTTD(mtdRevenue)}</p>
          <p className="text-xs text-muted mt-0.5">MTD Revenue</p>
        </div>
      </div>

      {orders.length === 0 && !error ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <ShoppingBag size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No orders yet</h3>
          <p className="text-muted mb-5 text-sm">Log your first customer order to start tracking revenue.</p>
          <Link href="/orders/new">
            <Button><Plus size={16} />Log First Order</Button>
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && <OrderTable rows={active} title={`Active (${active.length})`} />}
          {completed.length > 0 && <OrderTable rows={completed} title={`Completed / Cancelled (${completed.length})`} />}
        </>
      )}
    </PageWrapper>
  )
}
