import { NextResponse } from 'next/server'
import { onOrderPaymentChanged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const { orderId, newPaymentStatus } = await req.json()
    if (!orderId || !newPaymentStatus) {
      return NextResponse.json({ error: 'orderId and newPaymentStatus required' }, { status: 400 })
    }
    await onOrderPaymentChanged({ orderId, newPaymentStatus })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
