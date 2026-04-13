import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST() {
  const supabase = createAdminClient()
  const today    = new Date().toISOString().split('T')[0]
  const month    = new Date().toLocaleString('en-TT', { month: 'long', year: 'numeric' })

  // Gather context in parallel
  const [productsRes, whatsappRes, broadcastRes, recentOrdersRes] = await Promise.all([
    supabase
      .from('products')
      .select('name, direct_price, cafe_price, category, channel')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('on_whatsapp_list', true),
    supabase
      .from('broadcasts')
      .select('broadcast_date, message_text, products_featured')
      .eq('sent', true)
      .order('broadcast_date', { ascending: false })
      .limit(2),
    supabase
      .from('order_items')
      .select('products(name), quantity')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const products       = (productsRes.data ?? []) as { name: string; direct_price: number | null; cafe_price: number | null; category: string | null; channel: string }[]
  const whatsappCount  = whatsappRes.count ?? 0
  const recentBcasts   = (broadcastRes.data ?? []) as { broadcast_date: string; message_text: string; products_featured: string[] | null }[]

  // Tally top products from recent orders
  const freq: Record<string, number> = {}
  for (const item of (recentOrdersRes.data ?? []) as { products: { name: string }[] | null; quantity: number }[]) {
    const name = item.products?.[0]?.name
    if (name) freq[name] = (freq[name] ?? 0) + (item.quantity ?? 1)
  }
  const topProducts = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

  const productList = products
    .map(p => `- ${p.name} (TT$${p.direct_price ?? '?'} direct${p.cafe_price ? `, TT$${p.cafe_price} café` : ''})`)
    .join('\n')

  const pastBroadcasts = recentBcasts.length > 0
    ? recentBcasts.map(b => `[${b.broadcast_date}] ${b.message_text.slice(0, 300)}…`).join('\n\n')
    : 'None yet'

  const context = `
DATE: ${today} (${month})
WHATSAPP LIST SIZE: ${whatsappCount} customers

ACTIVE PRODUCTS:
${productList || 'No active products'}

TOP SELLERS (recent orders): ${topProducts.join(', ') || 'No data yet'}

RECENT BROADCAST STYLE REFERENCE:
${pastBroadcasts}
`.trim()

  const userPrompt = `Generate a WhatsApp Friday Pick-Up broadcast message for AhbooJ Desserts.
Use the context below. The message should:
- Open with a catchy hook / greeting
- Highlight 2–4 featured products from the active list (pick the top sellers or a good mix)
- Mention price for at least one item
- Include a clear call-to-action to reply and order
- Feel warm, personal, Caribbean — like a message from Hassan himself
- Use emojis tastefully (3–6 total)
- Be 150–250 words

After the broadcast message, add a short section "CAPTION IDEAS" with 2 Instagram caption variants (50–80 words each) for the same featured products.

CONTEXT:
${context}`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message   = await anthropic.messages.create({
      model:      'claude-opus-4-6',
      max_tokens: 1024,
      system:     'You are the marketing voice for AhbooJ Desserts, a premium artisanal dessert business in Trinidad and Tobago run by Hassan Jhaboo. Your writing is warm, engaging, and drives orders. You know the brand deeply.',
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const output      = message.content[0].type === 'text' ? message.content[0].text : ''
    const tokensUsed  = message.usage.input_tokens + message.usage.output_tokens

    await supabase.from('agent_runs').insert({
      agent_type:    'marketing',
      input_context: { whatsappCount, productCount: products.length, topProducts },
      output,
      tokens_used:   tokensUsed,
    })

    return NextResponse.json({ output, tokens_used: tokensUsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
