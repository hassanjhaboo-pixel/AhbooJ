import { createEventClient } from './client'
import { createAlert } from './alerts'
import { onCustomerOrderCompleted } from './customers'

export async function onOrderStatusChanged(params: {
  orderId: string
  oldStatus: string
  newStatus: string
}) {
  const { orderId, oldStatus, newStatus } = params
  console.log(`[events/orders] onOrderStatusChanged: ${orderId} ${oldStatus} → ${newStatus}`)

  const supabase = createEventClient()

  const { error: tsErr } = await supabase
    .from('orders')
    .update({ last_status_change: new Date().toISOString() })
    .eq('id', orderId)
  if (tsErr) console.error('[events/orders] last_status_change update failed:', tsErr.message)

  if (newStatus === 'dispatched') {
    console.log(`[events/orders] Deducting inventory for order ${orderId}`)

    type ItemRow = { product_id: string; quantity: number }
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId) as unknown as { data: ItemRow[] | null; error: { message: string } | null }

    if (itemsErr) {
      console.error('[events/orders] order_items fetch failed:', itemsErr.message)
    } else {
      console.log(`[events/orders] Found ${items?.length ?? 0} order items to deduct`)
      for (const item of items ?? []) {
        type ProdRow = { stock_on_hand: number }
        const { data: prod } = await supabase
          .from('products')
          .select('stock_on_hand')
          .eq('id', item.product_id)
          .single() as unknown as { data: ProdRow | null }

        if (prod && prod.stock_on_hand > 0) {
          const { error: deductErr } = await supabase
            .from('products')
            .update({ stock_on_hand: Math.max(0, prod.stock_on_hand - item.quantity) })
            .eq('id', item.product_id)
          if (deductErr) console.error('[events/orders] stock deduction failed:', deductErr.message)
        }
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

  console.log(`[events/orders] onOrderStatusChanged complete for ${orderId}`)
}

export async function onOrderPaymentChanged(params: {
  orderId: string
  newPaymentStatus: string
}) {
  const { orderId, newPaymentStatus } = params
  console.log(`[events/orders] onOrderPaymentChanged: ${orderId} → ${newPaymentStatus}`)

  if (newPaymentStatus !== 'paid') {
    console.log('[events/orders] Not "paid" — skipping ledger entry')
    return
  }

  const supabase = createEventClient()

  type OrderRow = { order_number: string | null; customer_id: string | null; total: number | null; order_date: string }
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('order_number, customer_id, total, order_date')
    .eq('id', orderId)
    .single() as unknown as { data: OrderRow | null; error: { message: string } | null }

  if (orderErr) {
    console.error('[events/orders] order fetch failed:', orderErr.message)
    return
  }
  if (!order || !order.total) {
    console.error('[events/orders] order not found or has no total:', orderId)
    return
  }

  console.log(`[events/orders] Creating ledger entry for order ${order.order_number}, total ${order.total}`)

  // Insert ledger entry — try with source columns first, fall back without
  const ledgerPayload = {
    type:        'income',
    category:    'sales',
    amount:      order.total,
    entry_date:  order.order_date,
    description: `Order ${order.order_number ?? orderId.slice(0, 8).toUpperCase()} — payment received`,
  }
  const { error: ledgerErr } = await supabase.from('ledger').insert({
    ...ledgerPayload,
    source_type: 'order',
    source_id:   orderId,
  })

  if (ledgerErr) {
    console.error('[events/orders] ledger insert (with source) failed:', ledgerErr.message)
    if (ledgerErr.message.includes('source_type') || ledgerErr.message.includes('source_id')) {
      const { error: fbErr } = await supabase.from('ledger').insert(ledgerPayload)
      if (fbErr) console.error('[events/orders] ledger insert (fallback) failed:', fbErr.message)
      else console.log('[events/orders] ledger entry created (fallback, no source columns)')
    }
  } else {
    console.log('[events/orders] ledger entry created successfully')
  }

  if (order.customer_id) {
    await onCustomerOrderCompleted({
      customerId:  order.customer_id,
      orderId,
      orderTotal:  order.total,
      orderDate:   order.order_date,
    })
  }

  console.log(`[events/orders] onOrderPaymentChanged complete for ${orderId}`)
}
