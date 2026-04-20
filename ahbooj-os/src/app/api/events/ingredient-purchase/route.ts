import { NextResponse } from 'next/server'
import { onIngredientPurchaseLogged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const { ingredientId, ingredientName, qty, totalPrice, purchaseDate } = await req.json()
    if (!ingredientId || !qty || !totalPrice) {
      return NextResponse.json({ error: 'ingredientId, qty and totalPrice required' }, { status: 400 })
    }
    await onIngredientPurchaseLogged({
      ingredientId,
      ingredientName: ingredientName ?? 'Ingredient',
      qty: Number(qty),
      totalPrice: Number(totalPrice),
      purchaseDate: purchaseDate ?? new Date().toISOString().split('T')[0],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
