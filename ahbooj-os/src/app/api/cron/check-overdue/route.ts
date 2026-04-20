import { NextResponse } from 'next/server'
import { markOverduePartnerOrders } from '@/lib/events'

export async function GET() {
  try {
    const count = await markOverduePartnerOrders()
    return NextResponse.json({ ok: true, markedOverdue: count })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
