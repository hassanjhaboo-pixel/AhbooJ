import { createAdminClient } from '@/lib/supabase/admin'
import { createAlert } from './alerts'

export async function onIngredientPurchaseLogged(params: {
  ingredientId: string
  ingredientName: string
  qty: number
  totalPrice: number
  purchaseDate: string
}) {
  const { ingredientId, ingredientName, qty, totalPrice, purchaseDate } = params
  const supabase = createAdminClient()

  // Add expense ledger entry
  const { error: ledgerErr } = await supabase.from('ledger').insert({
    type:        'expense',
    category:    'ingredients',
    amount:      totalPrice,
    entry_date:  purchaseDate,
    description: `Ingredient purchase: ${ingredientName} × ${qty}`,
    source_type: 'ingredient',
    source_id:   ingredientId,
  })

  if (ledgerErr?.message?.includes('source_type') || ledgerErr?.message?.includes('source_id')) {
    await supabase.from('ledger').insert({
      type:        'expense',
      category:    'ingredients',
      amount:      totalPrice,
      entry_date:  purchaseDate,
      description: `Ingredient purchase: ${ingredientName} × ${qty}`,
    })
  }

  // Check new stock level vs threshold
  type IngRow = { stock_on_hand: number; low_stock_threshold: number }
  const { data: ing } = await supabase
    .from('ingredients')
    .select('stock_on_hand, low_stock_threshold')
    .eq('id', ingredientId)
    .single() as unknown as { data: IngRow | null }

  if (ing && ing.low_stock_threshold > 0 && ing.stock_on_hand > ing.low_stock_threshold) {
    // Dismiss any existing low-stock alert for this ingredient
    await supabase
      .from('dashboard_alerts')
      .update({ is_read: true })
      .eq('type', 'low_stock')
      .eq('entity_id', ingredientId)
      .eq('is_read', false)
  }

  // Propagate cost to recipes + products
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/ingredients/${ingredientId}/propagate-cost`, {
    method: 'POST',
  }).catch(() => {})

  await createAlert({
    type:        'ingredient_purchased',
    severity:    'info',
    title:       `${ingredientName} restocked`,
    message:     `${qty} units added — TT$${totalPrice.toFixed(2)} spent`,
    entity_type: 'ingredient',
    entity_id:   ingredientId,
  })
}

export async function checkIngredientLowStock(ingredientId: string, ingredientName: string) {
  const supabase = createAdminClient()

  type IngRow = { stock_on_hand: number; low_stock_threshold: number }
  const { data: ing } = await supabase
    .from('ingredients')
    .select('stock_on_hand, low_stock_threshold')
    .eq('id', ingredientId)
    .single() as unknown as { data: IngRow | null }

  if (!ing || ing.low_stock_threshold <= 0) return

  if (ing.stock_on_hand <= ing.low_stock_threshold) {
    // Only create if no existing unread alert
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
