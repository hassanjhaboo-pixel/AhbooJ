import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { TrendingUp, ShoppingCart, Building2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatTTD } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StatCard } from '@/components/ui/StatCard'
import { RevenueCard } from './_components/RevenueCard'
import { StockAlertsCard } from './_components/StockAlertsCard'
import { B2BOrdersCard } from './_components/B2BOrdersCard'
import { ProductionCard } from './_components/ProductionCard'
import { BroadcastCard } from './_components/BroadcastCard'
import { QuickActions } from './_components/QuickActions'

async function fetchDashboardData() {
  const supabase = await createClient()
  const now = new Date()

  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const weekStart  = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd    = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monthLabel = format(now, 'MMMM yyyy')

  const [
    ledgerRes,
    goalRes,
    pendingOrdersRes,
    b2bOrdersRes,
    reserveRes,
    ingredientsRes,
    batchesRes,
    broadcastRes,
  ] = await Promise.all([
    // MTD income
    supabase
      .from('ledger')
      .select('amount')
      .eq('type', 'income')
      .gte('entry_date', monthStart)
      .lte('entry_date', monthEnd),

    // Monthly goal
    supabase
      .from('goals')
      .select('revenue_target, revenue_actual, order_count_target, order_count_actual')
      .eq('period_type', 'monthly')
      .eq('period_label', monthLabel)
      .maybeSingle(),

    // Orders pending dispatch
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['confirmed', 'in_production', 'ready']),

    // Active B2B orders with partner name
    supabase
      .from('partner_orders')
      .select('id, invoice_number, status, total, due_date, order_date, partners(name)')
      .not('status', 'in', '("paid","cancelled")')
      .order('order_date', { ascending: false })
      .limit(5),

    // Latest cash reserve snapshot
    supabase
      .from('reserves')
      .select('reserve_weeks_covered, total_cash')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // All ingredients with threshold set (we filter low-stock in JS)
    supabase
      .from('ingredients')
      .select('id, name, unit, stock_on_hand, low_stock_threshold')
      .gt('low_stock_threshold', 0)
      .order('name'),

    // Production batches this week
    supabase
      .from('production_batches')
      .select('id, batch_number, production_date, planned_yield, actual_yield, qc_passed, recipes(name)')
      .gte('production_date', weekStart)
      .lte('production_date', weekEnd)
      .order('production_date', { ascending: false }),

    // Last broadcast
    supabase
      .from('broadcasts')
      .select('*')
      .order('broadcast_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Compute MTD revenue from ledger rows
  const ledgerRows = (ledgerRes.data ?? []) as Array<{ amount: number }>
  const mtdRevenue = ledgerRows.reduce((sum, row) => sum + row.amount, 0)

  // Revenue goal for this month
  const goalRow = goalRes.data as { revenue_target: number | null } | null
  const monthlyGoal = goalRow?.revenue_target ?? 0

  // Stock alerts: stock_on_hand <= low_stock_threshold
  type IngRow = { id: string; name: string; unit: string; stock_on_hand: number; low_stock_threshold: number }
  const ingredientRows = (ingredientsRes.data ?? []) as IngRow[]
  const stockAlerts = ingredientRows.filter(
    ing => ing.stock_on_hand <= ing.low_stock_threshold
  )

  // Days until next Friday (0 = today is Friday)
  const dow = now.getDay() // 0=Sun … 6=Sat
  const daysUntilFriday = dow === 5 ? 0 : (5 - dow + 7) % 7

  return {
    mtdRevenue,
    monthlyGoal,
    monthLabel,
    pendingOrdersCount: pendingOrdersRes.count ?? 0,
    b2bOrders: (b2bOrdersRes.data ?? []) as Array<{
      id: string
      invoice_number: string | null
      status: string
      total: number | null
      due_date: string | null
      order_date: string
      partners: { name: string }[] | null
    }>,
    reserve: (reserveRes.data ?? null) as { reserve_weeks_covered: number | null; total_cash: number | null } | null,
    stockAlerts,
    batches: (batchesRes.data ?? []) as Array<{
      id: string; batch_number: string | null; production_date: string
      planned_yield: number | null; actual_yield: number | null
      qc_passed: boolean | null; recipes: { name: string }[] | null
    }>,
    lastBroadcast: (broadcastRes.data ?? null) as import('@/types/database').Broadcast | null,
    daysUntilFriday,
    greeting: format(now, "EEEE, MMMM d"),
  }
}

export default async function DashboardPage() {
  const data = await fetchDashboardData()

  const runwayWeeks = data.reserve?.reserve_weeks_covered ?? null
  const runwayLabel = runwayWeeks !== null
    ? `${runwayWeeks.toFixed(1)} weeks`
    : '—'

  return (
    <PageWrapper>
      {/* Morning header */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-1">
          {data.greeting}
        </p>
        <h2 className="font-display text-2xl font-semibold text-espresso">
          Good morning, Hassan
        </h2>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="MTD Revenue"
          value={formatTTD(data.mtdRevenue)}
          subValue={data.monthLabel}
          icon={TrendingUp}
        />
        <StatCard
          label="Orders Pending"
          value={data.pendingOrdersCount}
          subValue="confirmed + in production"
          icon={ShoppingCart}
        />
        <StatCard
          label="Active B2B"
          value={data.b2bOrders.length}
          subValue="outstanding orders"
          icon={Building2}
        />
        <StatCard
          label="Cash Runway"
          value={runwayLabel}
          subValue={data.reserve?.total_cash ? `TT$${data.reserve.total_cash.toLocaleString()} on hand` : 'No snapshot yet'}
          icon={Clock}
        />
      </div>

      {/* Revenue progress */}
      <div className="mb-5">
        <RevenueCard
          actual={data.mtdRevenue}
          target={data.monthlyGoal}
          monthLabel={data.monthLabel}
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Left column */}
        <div className="space-y-5">
          <ProductionCard
            batches={data.batches}
            pendingOrdersCount={data.pendingOrdersCount}
          />
          <StockAlertsCard alerts={data.stockAlerts as import('@/types/database').Ingredient[]} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <B2BOrdersCard orders={data.b2bOrders} />
          <BroadcastCard
            lastBroadcast={data.lastBroadcast}
            daysUntilFriday={data.daysUntilFriday}
          />
        </div>
      </div>

      {/* Quick actions */}
      <QuickActions />
    </PageWrapper>
  )
}
