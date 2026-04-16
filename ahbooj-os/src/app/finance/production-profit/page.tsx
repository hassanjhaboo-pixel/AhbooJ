import Link from 'next/link'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProductionProfitChart } from './_components/ProductionProfitChart'

export default async function ProductionProfitPage() {
  const supabase = await createClient()

  // Last 30 days of production data
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')

  const [batchesRes, ordersRes] = await Promise.all([
    supabase
      .from('production_batches')
      .select('production_date, batch_cost, actual_yield, product_id, products(direct_price)')
      .gte('production_date', thirtyDaysAgo)
      .lte('production_date', today)
      .not('batch_cost', 'is', null),
    supabase
      .from('orders')
      .select('order_date, total, status')
      .gte('order_date', thirtyDaysAgo)
      .lte('order_date', today)
      .not('status', 'eq', 'cancelled'),
  ])

  const batches = (batchesRes.data ?? []) as unknown as Array<{
    production_date: string
    batch_cost: number | null
    actual_yield: number | null
    product_id: string | null
    products: { direct_price: number | null } | null
  }>

  const orders = (ordersRes.data ?? []) as Array<{
    order_date: string
    total: number | null
    status: string
  }>

  // Group by production date
  const dateMap = new Map<string, { batchCost: number; revenue: number }>()

  for (const batch of batches) {
    const existing = dateMap.get(batch.production_date) ?? { batchCost: 0, revenue: 0 }
    existing.batchCost += batch.batch_cost ?? 0
    // Estimate revenue: actual_yield × direct_price
    if (batch.actual_yield && batch.products?.direct_price) {
      existing.revenue += batch.actual_yield * batch.products.direct_price
    }
    dateMap.set(batch.production_date, existing)
  }

  // Add order revenue to matching dates
  for (const order of orders) {
    if (dateMap.has(order.order_date)) {
      const existing = dateMap.get(order.order_date)!
      existing.revenue += order.total ?? 0
    }
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      label: format(new Date(date + 'T00:00:00'), 'MMM d'),
      revenue: vals.revenue,
      batchCost: vals.batchCost,
      profit: vals.revenue - vals.batchCost,
    }))

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Finance
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-espresso">Profit per Production Day</h1>
          <p className="text-sm text-muted">Revenue vs batch cost over the last 30 days</p>
        </div>
      </div>

      <ProductionProfitChart data={chartData} />
    </PageWrapper>
  )
}
