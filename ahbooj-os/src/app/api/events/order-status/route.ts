import { NextResponse } from 'next/server'
import { onOrderStatusChanged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const { orderId, oldStatus, newStatus } = await req.json()
    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId and newStatus required' }, { status: 400 })
    }
    await onOrderStatusChanged({ orderId, oldStatus: oldStatus ?? '', newStatus })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
