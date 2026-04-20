import { NextResponse } from 'next/server'
import { onOrderPaymentChanged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[api/events/order-payment] received:', body)
    const { orderId, newPaymentStatus } = body
    if (!orderId || !newPaymentStatus) {
      return NextResponse.json({ error: 'orderId and newPaymentStatus required' }, { status: 400 })
    }
    await onOrderPaymentChanged({ orderId, newPaymentStatus })
    console.log('[api/events/order-payment] complete')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/events/order-payment] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
