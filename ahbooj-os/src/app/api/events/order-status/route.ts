import { NextResponse } from 'next/server'
import { onOrderStatusChanged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[api/events/order-status] received:', body)
    const { orderId, oldStatus, newStatus } = body
    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId and newStatus required' }, { status: 400 })
    }
    await onOrderStatusChanged({ orderId, oldStatus: oldStatus ?? '', newStatus })
    console.log('[api/events/order-status] complete')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/events/order-status] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
