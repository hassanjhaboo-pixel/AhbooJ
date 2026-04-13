import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARGIN_RULES } from '@/lib/pricing'

export async function POST() {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('name, sku, category, channel, direct_price, cafe_price, cost_per_unit, direct_margin, cafe_margin')
    .eq('is_active', true)
    .order('name') as unknown as {
      data: {
        name: string; sku: string | null; category: string | null; channel: string
        direct_price: number | null; cafe_price: number | null; cost_per_unit: number | null
        direct_margin: number | null; cafe_margin: number | null
      }[] | null
    }

  const list = (products ?? [])
  if (list.length === 0) {
    return NextResponse.json({ error: 'No active products found. Add products first.' }, { status: 400 })
  }

  const productLines = list.map(p => {
    const dmFlag = p.direct_margin != null && p.direct_margin < MARGIN_RULES.direct_floor ? ' ⚠️ BELOW FLOOR' : ''
    const cmFlag = p.cafe_margin   != null && p.cafe_margin   < MARGIN_RULES.cafe_floor   ? ' 🔴 DANGER'     : ''
    const dm = p.direct_margin != null ? `${p.direct_margin.toFixed(1)}%${dmFlag}` : 'n/a'
    const cm = p.cafe_margin   != null ? `${p.cafe_margin.toFixed(1)}%${cmFlag}`   : 'n/a'
    return `- ${p.name}${p.sku ? ` (${p.sku})` : ''}: cost TT$${p.cost_per_unit ?? '?'}, direct TT$${p.direct_price ?? '?'} (${dm}), café TT$${p.cafe_price ?? '?'} (${cm})`
  }).join('\n')

  const context = `
MARGIN RULES:
- Direct sales floor: ${MARGIN_RULES.direct_floor}% (strong: ${MARGIN_RULES.direct_strong}%+)
- Café sales floor: ${MARGIN_RULES.cafe_floor}% (danger below: ${MARGIN_RULES.cafe_danger}%)

CURRENT PRODUCTS (active):
${productLines}
`.trim()

  const userPrompt = `You are reviewing pricing for AhbooJ Desserts, a premium dessert business in Trinidad and Tobago.

${context}

Please provide:
1. **CRITICAL ISSUES** — any products below margin floor (direct < ${MARGIN_RULES.direct_floor}% or café < ${MARGIN_RULES.cafe_floor}%) with specific suggested prices to fix them
2. **OPPORTUNITIES** — products with room to increase price without hurting demand (strong margin but potentially underpriced)
3. **PRICE INCREASE CANDIDATES** — 1–3 products where a small price increase (TT$5–15) would significantly improve the business
4. **SUMMARY** — 2–3 sentence overall pricing health assessment

Be specific with numbers. All prices in TT$.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message   = await anthropic.messages.create({
      model:      'claude-opus-4-6',
      max_tokens: 1200,
      system:     'You are a pricing analyst for a small artisanal dessert business in Trinidad and Tobago. You give direct, numbers-first recommendations. You understand TT$ pricing and local market conditions.',
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const output     = message.content[0].type === 'text' ? message.content[0].text : ''
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

    await supabase.from('agent_runs').insert({
      agent_type:    'pricing',
      input_context: { productCount: list.length },
      output,
      tokens_used:   tokensUsed,
    })

    return NextResponse.json({ output, tokens_used: tokensUsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
