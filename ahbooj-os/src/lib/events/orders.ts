import { createAdminClient } from '@/lib/supabase/admin'
import { createAlert } from './alerts'
import { onCustomerOrderCompleted } from './customers'

export async function onOrderStatusChanged(params: {
  orderId: string
  oldStatus: string
  newStatus: string
}) {
  const { orderId, newStatus } = params
  const supabase = createAdminClient()

  await supabase.from('orders').update({ last_status_change: new Date().toISOString() }).eq('id', orderId)

  if (newStatus === 'dispatched') {
    // Deduct product stock_on_hand for each order item
    type ItemRow = { product_id: string; quantity: number }
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId) as unknown as { data: ItemRow[] | null }

    for (const item of items ?? []) {
      type ProdRow = { stock_on_hand: number }
      const { data: prod } = await supabase
        .from('products')
        .select('stock_on_hand')
        .eq('id', item.product_id)
        .single() as unknown as { data: ProdRow | null }

      if (prod && prod.stock_on_hand > 0) {
        await supabase.from('products').update({
          stock_on_hand: Math.max(0, prod.stock_on_hand - item.quantity),
        }).eq('id', item.product_id)
      }
    }

    await createAlert({
      type:        'order_dispatched',
      severity:    'info',
      title:       'Order dispatched',
      message:     `Order ${orderId.slice(0, 8).toUpperCase()} marked as dispatched`,
      entity_type: 'order',
      entity_id:   orderId,
    })
  }
}

export async function onOrderPaymentChanged(params: {
  orderId: string
  newPaymentStatus: string
}) {
  const { orderId, newPaymentStatus } = params
  if (newPaymentStatus !== 'paid') return

  const supabase = createAdminClient()

  type OrderRow = { order_number: string | null; customer_id: string | null; total: number | null; order_date: string }
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, customer_id, total, order_date')
    .eq('id', orderId)
    .single() as unknown as { data: OrderRow | null }

  if (!order || !order.total) return

  // Create ledger income entry
  const { error: ledgerErr } = await supabase.from('ledger').insert({
    type:        'income',
    category:    'sales',
    amount:      order.total,
    entry_date:  order.order_date,
    description: `Order ${order.order_number ?? orderId.slice(0, 8).toUpperCase()} — payment received`,
    source_type: 'order',
    source_id:   orderId,
  })

  if (ledgerErr?.message?.includes('source_type') || ledgerErr?.message?.includes('source_id')) {
    // Fallback if v3 columns not yet migrated
    await supabase.from('ledger').insert({
      type:        'income',
      category:    'sales',
      amount:      order.total,
      entry_date:  order.order_date,
      description: `Order ${order.order_number ?? orderId.slice(0, 8).toUpperCase()} — payment received`,
    })
  }

  // Update customer stats
  if (order.customer_id) {
    await onCustomerOrderCompleted({
      customerId:  order.customer_id,
      orderId:     orderId,
      orderTotal:  order.total,
      orderDate:   order.order_date,
    })
  }
}
