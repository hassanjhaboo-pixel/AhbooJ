import { createAdminClient } from '@/lib/supabase/admin'
import { createAlert } from './alerts'

const SPEND_MILESTONES = [500, 1000, 2500, 5000, 10000]

export async function onCustomerOrderCompleted(params: {
  customerId: string
  orderId: string
  orderTotal: number
  orderDate: string
}) {
  const { customerId, orderId, orderTotal, orderDate } = params
  const supabase = createAdminClient()

  type CustRow = { total_orders: number; total_spend: number; name: string }
  const { data: cust } = await supabase
    .from('customers')
    .select('total_orders, total_spend, name')
    .eq('id', customerId)
    .single() as unknown as { data: CustRow | null }

  if (!cust) return

  const newOrders = cust.total_orders + 1
  const newSpend  = cust.total_spend + orderTotal
  const prevSpend = cust.total_spend

  await supabase.from('customers').update({
    total_orders:    newOrders,
    total_spend:     newSpend,
    last_order_date: orderDate,
  }).eq('id', customerId)

  // Check spend milestones
  for (const milestone of SPEND_MILESTONES) {
    if (prevSpend < milestone && newSpend >= milestone) {
      await Promise.resolve(supabase.from('customer_milestones').insert({
        customer_id: customerId,
        milestone:   `spend_${milestone}`,
      })).catch(() => {})

      await createAlert({
        type:        'customer_milestone',
        severity:    'info',
        title:       `${cust.name} reached TT$${milestone.toLocaleString()} spend`,
        message:     `Customer milestone: ${newOrders} orders, TT$${newSpend.toFixed(2)} lifetime spend`,
        entity_type: 'customer',
        entity_id:   customerId,
      })
    }
  }

  // 5th, 10th, 20th order milestones
  if ([5, 10, 20, 50].includes(newOrders)) {
    await createAlert({
      type:        'customer_milestone',
      severity:    'info',
      title:       `${cust.name} placed order #${newOrders}!`,
      message:     `Loyal customer — consider a thank-you message`,
      entity_type: 'customer',
      entity_id:   customerId,
    })
  }
}
