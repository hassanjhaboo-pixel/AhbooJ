import { NextResponse } from 'next/server'
import { onPartnerOrderStatusChanged } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const { partnerOrderId, newStatus } = await req.json()
    if (!partnerOrderId || !newStatus) {
      return NextResponse.json({ error: 'partnerOrderId and newStatus required' }, { status: 400 })
    }
    await onPartnerOrderStatusChanged({ partnerOrderId, newStatus })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
