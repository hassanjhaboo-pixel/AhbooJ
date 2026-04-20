import { NextResponse } from 'next/server'
import { onIngredientPurchaseLogged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[api/events/ingredient-purchase] received:', body)
    const { ingredientId, ingredientName, qty, totalPrice, purchaseDate } = body
    if (!ingredientId || !qty || !totalPrice) {
      return NextResponse.json({ error: 'ingredientId, qty and totalPrice required' }, { status: 400 })
    }
    await onIngredientPurchaseLogged({
      ingredientId,
      ingredientName: ingredientName ?? 'Ingredient',
      qty:          Number(qty),
      totalPrice:   Number(totalPrice),
      purchaseDate: purchaseDate ?? new Date().toISOString().split('T')[0],
    })
    console.log('[api/events/ingredient-purchase] complete')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/events/ingredient-purchase] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
