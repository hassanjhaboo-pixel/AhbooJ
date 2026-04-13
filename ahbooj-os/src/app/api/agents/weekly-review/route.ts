import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = createAdminClient()

  const now       = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const todayStr     = now.toISOString().split('T')[0]

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [ordersRes, batchesRes, newCustomersRes, partnerOrdersRes, ledgerRes, drawsRes] = await Promise.all([
    // This week's orders
    supabase
      .from('orders')
      .select('id, status, total, order_date, customers(name)')
      .gte('order_date', weekStartStr),
    // This week's production
    supabase
      .from('production_batches')
      .select('batch_number, recipe_id, planned_yield, actual_yield, qc_passed, production_date, recipes(name)')
      .gte('production_date', weekStartStr),
    // New customers this week
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString()),
    // Open partner orders (outstanding)
    supabase
      .from('partner_orders')
      .select('invoice_number, total, due_date, status, partners(name)')
      .not('status', 'in', '("paid","cancelled")'),
    // MTD ledger summary
    supabase
      .from('ledger')
      .select('type, amount')
      .gte('entry_date', monthStart),
    // Draws this month
    supabase
      .from('owner_draws')
      .select('amount')
      .gte('draw_date', monthStart),
  ])

  const orders        = (ordersRes.data ?? []) as { id: string; status: string; total: number | null; order_date: string; customers: { name: string }[] | null }[]
  const batches       = (batchesRes.data ?? []) as { batch_number: string; planned_yield: number | null; actual_yield: number | null; qc_passed: boolean | null; production_date: string; recipes: { name: string }[] | null }[]
  const newCustomers  = newCustomersRes.count ?? 0
  const openPartner   = (partnerOrdersRes.data ?? []) as { invoice_number: string | null; total: number | null; due_date: string | null; status: string; partners: { name: string }[] | null }[]
  const ledgerEntries = (ledgerRes.data ?? []) as { type: string; amount: number }[]
  const draws         = (drawsRes.data ?? []) as { amount: number }[]

  // Compute metrics
  const weekRevenue     = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total ?? 0), 0)
  const pendingOrders   = orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
  const qcFailed        = batches.filter(b => b.qc_passed === false).length
  const qcPassed        = batches.filter(b => b.qc_passed === true).length
  const batchesPending  = batches.filter(b => b.qc_passed === null).length
  const mtdIncome       = ledgerEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const mtdExpenses     = ledgerEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const mtdDraws        = draws.reduce((s, d) => s + d.amount, 0)
  const outstanding     = openPartner.reduce((s, o) => s + (o.total ?? 0), 0)

  const overduePartner = openPartner.filter(o => o.due_date && new Date(o.due_date) < now)

  const batchList = batches.map(b =>
    `${b.recipes?.[0]?.name ?? 'Unknown'}: planned ${b.planned_yield ?? '?'}, actual ${b.actual_yield ?? 'not set'}, QC: ${b.qc_passed === true ? 'PASS' : b.qc_passed === false ? 'FAIL' : 'pending'}`
  ).join('\n') || 'No batches this week'

  const context = `
WEEK: ${weekStartStr} → ${todayStr}

ORDERS THIS WEEK (${orders.length} total):
- Revenue: TT$${weekRevenue.toFixed(2)}
- Pending/Confirmed: ${pendingOrders}
- Delivered: ${deliveredOrders}
- Cancelled: ${cancelledOrders}
- New customers this week: ${newCustomers}

PRODUCTION THIS WEEK (${batches.length} batches):
${batchList}
- QC passed: ${qcPassed}, QC failed: ${qcFailed}, Pending QC: ${batchesPending}

PARTNER (B2B) OUTSTANDING:
- Open orders: ${openPartner.length} (TT$${outstanding.toFixed(2)} total)
- Overdue: ${overduePartner.length} ${overduePartner.length > 0 ? '⚠️' : ''}

MTD FINANCE (${now.toLocaleString('en-TT', { month: 'long' })}):
- Income: TT$${mtdIncome.toFixed(2)}
- Expenses: TT$${mtdExpenses.toFixed(2)}
- Net: TT$${(mtdIncome - mtdExpenses).toFixed(2)}
- Owner draws: TT$${mtdDraws.toFixed(2)}
`.trim()

  const userPrompt = `Generate a weekly business review for AhbooJ Desserts.

${context}

Produce a concise, scannable report with these sections:
1. **📊 WEEK IN NUMBERS** — 3–4 key headline metrics with brief commentary
2. **✅ WINS THIS WEEK** — what went well (be specific to the data)
3. **⚠️ WATCH LIST** — anything that needs attention (low stock, QC fails, overdue invoices, etc.)
4. **🎯 3 ACTION ITEMS FOR NEXT WEEK** — concrete, prioritised actions Hassan should take
5. **💡 ONE BIG IDEA** — one strategic thought for the business based on the week's data

Keep the whole thing under 400 words. Be direct and actionable — this is a weekly tool Hassan reads every Monday morning.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message   = await anthropic.messages.create({
      model:      'claude-opus-4-6',
      max_tokens: 1000,
      system:     'You are the business analyst for AhbooJ Desserts, a premium artisanal dessert business in Trinidad and Tobago. You produce clear, concise weekly reviews that help Hassan Jhaboo make good decisions. You are direct, data-driven, and encouraging.',
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const output     = message.content[0].type === 'text' ? message.content[0].text : ''
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

    await supabase.from('agent_runs').insert({
      agent_type:    'weekly-review',
      input_context: { weekStart: weekStartStr, orderCount: orders.length, weekRevenue, batchCount: batches.length },
      output,
      tokens_used:   tokensUsed,
    })

    return NextResponse.json({ output, tokens_used: tokensUsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
