import { createEventClient } from './client'
import { createAlert } from './alerts'

export async function onPartnerOrderStatusChanged(params: {
  partnerOrderId: string
  newStatus: string
}) {
  const { partnerOrderId, newStatus } = params
  console.log(`[events/partners] onPartnerOrderStatusChanged: ${partnerOrderId} → ${newStatus}`)

  const supabase = createEventClient()

  if (newStatus === 'paid') {
    type PORow = { invoice_number: string | null; total: number | null; order_date: string; partners: { name: string }[] | null }
    const { data: po, error: poErr } = await supabase
      .from('partner_orders')
      .select('invoice_number, total, order_date, partners(name)')
      .eq('id', partnerOrderId)
      .single() as unknown as { data: PORow | null; error: { message: string } | null }

    if (poErr) {
      console.error('[events/partners] partner_order fetch failed:', poErr.message)
    } else if (po?.total) {
      const partnerName = po.partners?.[0]?.name ?? 'Partner'
      const ledgerPayload = {
        type:        'income',
        category:    'b2b',
        amount:      po.total,
        entry_date:  po.order_date,
        description: `B2B invoice ${po.invoice_number ?? partnerOrderId.slice(0, 8)} — ${partnerName}`,
      }
      const { error: ledgerErr } = await supabase.from('ledger').insert({
        ...ledgerPayload,
        source_type: 'partner_order',
        source_id:   partnerOrderId,
      })
      if (ledgerErr) {
        console.error('[events/partners] ledger insert (with source) failed:', ledgerErr.message)
        if (ledgerErr.message.includes('source_type') || ledgerErr.message.includes('source_id')) {
          const { error: fbErr } = await supabase.from('ledger').insert(ledgerPayload)
          if (fbErr) console.error('[events/partners] ledger insert (fallback) failed:', fbErr.message)
        }
      } else {
        console.log('[events/partners] ledger entry created for paid partner order')
      }
    }
  }

  if (newStatus === 'overdue') {
    type PORow = { invoice_number: string | null; due_date: string | null; partners: { name: string }[] | null }
    const { data: po } = await supabase
      .from('partner_orders')
      .select('invoice_number, due_date, partners(name)')
      .eq('id', partnerOrderId)
      .single() as unknown as { data: PORow | null }

    const partnerName = po?.partners?.[0]?.name ?? 'Partner'
    await createAlert({
      type:        'partner_order_overdue',
      severity:    'critical',
      title:       `Overdue invoice — ${partnerName}`,
      message:     `Invoice ${po?.invoice_number ?? partnerOrderId.slice(0, 8)} was due ${po?.due_date ?? 'unknown date'}`,
      entity_type: 'partner_order',
      entity_id:   partnerOrderId,
    })
  }

  console.log(`[events/partners] onPartnerOrderStatusChanged complete for ${partnerOrderId}`)
}

export async function markOverduePartnerOrders() {
  console.log('[events/partners] markOverduePartnerOrders start')
  const supabase = createEventClient()
  const today = new Date().toISOString().split('T')[0]

  type PORow = { id: string; invoice_number: string | null }
  const { data: overdue, error } = await supabase
    .from('partner_orders')
    .select('id, invoice_number')
    .in('status', ['invoiced', 'confirmed', 'delivered'])
    .lt('due_date', today) as unknown as { data: PORow[] | null; error: { message: string } | null }

  if (error) {
    console.error('[events/partners] overdue fetch failed:', error.message)
    return 0
  }

  console.log(`[events/partners] Found ${overdue?.length ?? 0} overdue partner orders`)
  for (const po of overdue ?? []) {
    await supabase.from('partner_orders').update({ status: 'overdue' }).eq('id', po.id)
    await onPartnerOrderStatusChanged({ partnerOrderId: po.id, newStatus: 'overdue' })
  }

  return (overdue ?? []).length
}
