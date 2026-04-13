import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST() {
  const supabase = createAdminClient()
  const today    = new Date()
  const month    = today.toLocaleString('en-TT', { month: 'long' })

  const [productsRes, recipesRes, ingredientsRes, topItemsRes] = await Promise.all([
    supabase
      .from('products')
      .select('name, category, channel')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('recipes')
      .select('name, category, base_yield_units')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('ingredients')
      .select('name, category, stock_on_hand, reorder_point, unit')
      .gte('stock_on_hand', 0)
      .order('stock_on_hand', { ascending: false })
      .limit(20),
    supabase
      .from('order_items')
      .select('products(name), quantity')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const products    = (productsRes.data ?? [])    as { name: string; category: string | null; channel: string }[]
  const recipes     = (recipesRes.data ?? [])     as { name: string; category: string | null; base_yield_units: number }[]
  const ingredients = (ingredientsRes.data ?? []) as { name: string; category: string | null; stock_on_hand: number; reorder_point: number | null; unit: string | null }[]

  // Top sellers
  const freq: Record<string, number> = {}
  for (const item of (topItemsRes.data ?? []) as { products: { name: string }[] | null; quantity: number }[]) {
    const name = item.products?.[0]?.name
    if (name) freq[name] = (freq[name] ?? 0) + (item.quantity ?? 1)
  }
  const topSellers = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([n, q]) => `${n} (${q} units)`)

  // Well-stocked ingredients
  const wellStocked = ingredients
    .filter(i => i.stock_on_hand > (i.reorder_point ?? 0) * 2)
    .slice(0, 10)
    .map(i => `${i.name} (${i.stock_on_hand} ${i.unit ?? 'units'})`)

  const context = `
DATE: ${today.toISOString().split('T')[0]} — Current month: ${month}
SEASON NOTE: Trinidad & Tobago — consider local holidays, Carnival (Feb), Divali (Oct/Nov), Christmas (Dec), beach season.

CURRENT ACTIVE PRODUCTS (${products.length}):
${products.map(p => `- ${p.name} (${p.category ?? 'general'}, ${p.channel})`).join('\n') || 'None'}

ACTIVE RECIPES (${recipes.length}):
${recipes.map(r => `- ${r.name} (${r.category ?? 'general'}, yields ${r.base_yield_units} units)`).join('\n') || 'None'}

TOP SELLING PRODUCTS (recent):
${topSellers.join(', ') || 'No data yet'}

WELL-STOCKED INGREDIENTS:
${wellStocked.join(', ') || 'No data'}
`.trim()

  const userPrompt = `You are the product strategist for AhbooJ Desserts in Trinidad and Tobago.

${context}

Based on what's selling, available ingredients, current recipes, and the season, suggest:

1. **NEW PRODUCT IDEAS** (3–4 ideas) — new products that could be made with current or similar ingredients. Include a brief rationale and suggested direct price in TT$.

2. **LIMITED-TIME SPECIALS** (2–3 ideas) — seasonal or event-driven specials relevant to the current month/upcoming T&T holidays or events.

3. **RECIPE VARIATIONS** (1–2 ideas) — variations on existing popular products (e.g. mini size, gift box, new flavour) that require minimal new investment.

4. **WHAT TO DROP** — any thoughts on existing products that might not be worth keeping based on what you know.

Be specific and creative. Keep T&T tastes and culture in mind.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message   = await anthropic.messages.create({
      model:      'claude-opus-4-6',
      max_tokens: 1500,
      system:     'You are a creative food product strategist specialising in artisanal Caribbean desserts. You understand Trinidad and Tobago culture, flavours (rum, coconut, guava, soursop, passion fruit, sorrel, pomerac), and the local small-business market. You give practical, specific ideas.',
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const output     = message.content[0].type === 'text' ? message.content[0].text : ''
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

    await supabase.from('agent_runs').insert({
      agent_type:    'product-discovery',
      input_context: { productCount: products.length, recipeCount: recipes.length, topSellers },
      output,
      tokens_used:   tokensUsed,
    })

    return NextResponse.json({ output, tokens_used: tokensUsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
