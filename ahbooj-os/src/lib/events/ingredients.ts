import { createEventClient } from './client'
import { createAlert } from './alerts'
import { propagateIngredientCost } from '@/lib/propagate-cost'

export async function onIngredientPurchaseLogged(params: {
  ingredientId: string
  ingredientName: string
  qty: number
  totalPrice: number
  purchaseDate: string
}) {
  const { ingredientId, ingredientName, qty, totalPrice, purchaseDate } = params
  console.log(`[events/ingredients] onIngredientPurchaseLogged: ${ingredientName} qty=${qty} price=${totalPrice}`)

  const supabase = createEventClient()

  // Add expense ledger entry — try with source columns, fall back without
  const ledgerPayload = {
    type:        'expense',
    category:    'ingredients',
    amount:      totalPrice,
    entry_date:  purchaseDate,
    description: `Ingredient purchase: ${ingredientName} × ${qty}`,
  }
  const { error: ledgerErr } = await supabase.from('ledger').insert({
    ...ledgerPayload,
    source_type: 'ingredient',
    source_id:   ingredientId,
  })

  if (ledgerErr) {
    console.error('[events/ingredients] ledger insert (with source) failed:', ledgerErr.message)
    if (ledgerErr.message.includes('source_type') || ledgerErr.message.includes('source_id')) {
      const { error: fbErr } = await supabase.from('ledger').insert(ledgerPayload)
      if (fbErr) console.error('[events/ingredients] ledger insert (fallback) failed:', fbErr.message)
      else console.log('[events/ingredients] ledger entry created (fallback)')
    }
  } else {
    console.log('[events/ingredients] ledger entry created')
  }

  // Check stock vs threshold — dismiss or skip alert
  type IngRow = { stock_on_hand: number; low_stock_threshold: number }
  const { data: ing, error: ingErr } = await supabase
    .from('ingredients')
    .select('stock_on_hand, low_stock_threshold')
    .eq('id', ingredientId)
    .single() as unknown as { data: IngRow | null; error: { message: string } | null }

  if (ingErr) {
    console.error('[events/ingredients] ingredient fetch failed:', ingErr.message)
  } else if (ing && ing.low_stock_threshold > 0 && ing.stock_on_hand > ing.low_stock_threshold) {
    await supabase
      .from('dashboard_alerts')
      .update({ is_read: true })
      .eq('type', 'low_stock')
      .eq('entity_id', ingredientId)
      .eq('is_read', false)
    console.log('[events/ingredients] dismissed low-stock alert')
  }

  // Propagate cost cascade directly (no self-HTTP call — breaks in serverless)
  try {
    const result = await propagateIngredientCost(supabase, ingredientId)
    console.log(`[events/ingredients] cost propagated: ${result.recipesAffected} recipes, ${result.productsUpdated} products`)
  } catch (err) {
    console.error('[events/ingredients] propagateIngredientCost failed:', err)
  }

  await createAlert({
    type:        'ingredient_purchased',
    severity:    'info',
    title:       `${ingredientName} restocked`,
    message:     `${qty} units added — TT$${totalPrice.toFixed(2)} spent`,
    entity_type: 'ingredient',
    entity_id:   ingredientId,
  })

  console.log('[events/ingredients] onIngredientPurchaseLogged complete')
}

export async function checkIngredientLowStock(ingredientId: string, ingredientName: string) {
  console.log(`[events/ingredients] checkIngredientLowStock: ${ingredientName}`)
  const supabase = createEventClient()

  type IngRow = { stock_on_hand: number; low_stock_threshold: number }
  const { data: ing } = await supabase
    .from('ingredients')
    .select('stock_on_hand, low_stock_threshold')
    .eq('id', ingredientId)
    .single() as unknown as { data: IngRow | null }

  if (!ing || ing.low_stock_threshold <= 0) return

  if (ing.stock_on_hand <= ing.low_stock_threshold) {
    const { data: existing } = await supabase
      .from('dashboard_alerts')
      .select('id')
      .eq('type', 'low_stock')
      .eq('entity_id', ingredientId)
      .eq('is_read', false)
      .limit(1) as unknown as { data: Array<{ id: string }> | null }

    if (!existing?.length) {
      await createAlert({
        type:        'low_stock',
        severity:    ing.stock_on_hand === 0 ? 'critical' : 'warning',
        title:       `Low stock: ${ingredientName}`,
        message:     `${ing.stock_on_hand} remaining (threshold: ${ing.low_stock_threshold})`,
        entity_type: 'ingredient',
        entity_id:   ingredientId,
      })
    }
  }
}
