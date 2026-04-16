import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { formatTTD } from '@/lib/formatting'

type Referrer = {
  id: string
  name: string
  referral_count: number
  total_spend: number
  referred_customers: { id: string; name: string; total_spend: number }[]
}

export function ReferralLeaderboard({ referrers }: { referrers: Referrer[] }) {
  if (referrers.length === 0) {
    return (
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
        <Trophy className="w-10 h-10 text-muted/30 mx-auto mb-3" />
        <p className="text-sm text-muted">No referrals recorded yet.</p>
        <p className="text-xs text-muted mt-1">
          When adding a customer, set the &quot;Referred by&quot; field to track referrals.
        </p>
      </div>
    )
  }

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-3">
      {referrers.map((referrer, idx) => (
        <div key={referrer.id} className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-4">
            <span className="text-2xl w-8 flex-shrink-0">{MEDALS[idx] ?? `#${idx + 1}`}</span>
            <div className="flex-1">
              <Link
                href={`/crm/${referrer.id}`}
                className="font-display font-semibold text-espresso hover:text-terracotta transition-colors"
              >
                {referrer.name}
              </Link>
              <p className="text-xs text-muted mt-0.5">
                Own spend: {formatTTD(referrer.total_spend)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-terracotta">{referrer.referral_count}</p>
              <p className="text-xs text-muted">referral{referrer.referral_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {referrer.referred_customers.length > 0 && (
            <div className="px-5 pb-4">
              <div className="flex flex-wrap gap-2">
                {referrer.referred_customers.slice(0, 5).map(c => (
                  <Link
                    key={c.id}
                    href={`/crm/${c.id}`}
                    className="text-xs bg-espresso/5 hover:bg-terracotta/10 hover:text-terracotta px-2.5 py-1 rounded-full text-muted transition-colors"
                  >
                    {c.name} · {formatTTD(c.total_spend)}
                  </Link>
                ))}
                {referrer.referred_customers.length > 5 && (
                  <span className="text-xs text-muted px-2.5 py-1">
                    +{referrer.referred_customers.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
