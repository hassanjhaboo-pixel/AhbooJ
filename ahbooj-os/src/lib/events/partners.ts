import { createAdminClient } from '@/lib/supabase/admin'
import { createAlert } from './alerts'

export async function onPartnerOrderStatusChanged(params: {
  partnerOrderId: string
  newStatus: string
}) {
  const { partnerOrderId, newStatus } = params
  const supabase = createAdminClient()

  if (newStatus === 'paid') {
    type PORow = { invoice_number: string | null; total: number | null; order_date: string; partners: { name: string }[] | null }
    const { data: po } = await supabase
      .from('partner_orders')
      .select('invoice_number, total, order_date, partners(name)')
      .eq('id', partnerOrderId)
      .single() as unknown as { data: PORow | null }

    if (po?.total) {
      const partnerName = po.partners?.[0]?.name ?? 'Partner'
      const { error: ledgerErr } = await supabase.from('ledger').insert({
        type:        'income',
        category:    'b2b',
        amount:      po.total,
        entry_date:  po.order_date,
        description: `B2B invoice ${po.invoice_number ?? partnerOrderId.slice(0, 8)} — ${partnerName}`,
        source_type: 'partner_order',
        source_id:   partnerOrderId,
      })

      if (ledgerErr?.message?.includes('source_type') || ledgerErr?.message?.includes('source_id')) {
        await supabase.from('ledger').insert({
          type:        'income',
          category:    'b2b',
          amount:      po.total,
          entry_date:  po.order_date,
          description: `B2B invoice ${po.invoice_number ?? partnerOrderId.slice(0, 8)} — ${partnerName}`,
        })
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
}

export async function markOverduePartnerOrders() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  type PORow = { id: string; invoice_number: string | null; partners: { name: string }[] | null }
  const { data: overdue } = await supabase
    .from('partner_orders')
    .select('id, invoice_number, partners(name)')
    .in('status', ['invoiced', 'confirmed', 'delivered'])
    .lt('due_date', today) as unknown as { data: PORow[] | null }

  for (const po of overdue ?? []) {
    await supabase.from('partner_orders').update({ status: 'overdue' }).eq('id', po.id)
    await onPartnerOrderStatusChanged({ partnerOrderId: po.id, newStatus: 'overdue' })
  }

  return (overdue ?? []).length
}
