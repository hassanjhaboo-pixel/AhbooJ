import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import { formatDate } from '@/lib/formatting'
import type { Broadcast } from '@/types/database'

interface BroadcastCardProps {
  lastBroadcast: Broadcast | null
  daysUntilFriday: number
}

export function BroadcastCard({ lastBroadcast, daysUntilFriday }: BroadcastCardProps) {
  const urgency = daysUntilFriday <= 1
  const dayLabel = daysUntilFriday === 0
    ? 'Today is Friday — time to broadcast!'
    : daysUntilFriday === 1
    ? 'Broadcast tomorrow (Friday)'
    : `${daysUntilFriday} days until Friday`

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-espresso">Next Broadcast</h3>
        <Link href="/marketing/broadcast" className="text-xs text-terracotta hover:underline">
          Build message →
        </Link>
      </div>

      <div className={`rounded-lg p-3 mb-3 ${urgency ? 'bg-terracotta/10 border border-terracotta/20' : 'bg-warm-white'}`}>
        <div className="flex items-center gap-2">
          <Megaphone size={15} className={urgency ? 'text-terracotta' : 'text-muted'} />
          <p className={`text-sm font-medium ${urgency ? 'text-terracotta' : 'text-espresso'}`}>
            {dayLabel}
          </p>
        </div>
      </div>

      {lastBroadcast ? (
        <div>
          <p className="text-xs text-muted mb-1">Last sent</p>
          <p className="text-sm text-espresso line-clamp-2">{lastBroadcast.message_text}</p>
          <p className="text-xs text-muted mt-1">
            {formatDate(lastBroadcast.broadcast_date, 'EEE, MMM d')}
            {lastBroadcast.sent ? ' · Sent' : ' · Draft'}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted">No broadcasts yet</p>
      )}
    </div>
  )
}
