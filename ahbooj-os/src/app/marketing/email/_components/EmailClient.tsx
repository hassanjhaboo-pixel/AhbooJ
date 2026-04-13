'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatPercent } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AddCampaignModal } from './AddCampaignModal'

type Campaign = {
  id: string
  name: string
  subject: string | null
  campaign_type: string | null
  status: string
  sent_at: string | null
  recipient_count: number | null
  open_rate: number | null
  notes: string | null
}

const STATUS_VARIANT: Record<string, 'amber' | 'green' | 'muted'> = {
  draft:     'amber',
  scheduled: 'gold' as 'amber', // fallback
  sent:      'green',
}

const TYPE_LABEL: Record<string, string> = {
  newsletter:      'Newsletter',
  'product-launch': 'Product Launch',
  seasonal:        'Seasonal',
  promo:           'Promo',
  're-engagement': 'Re-engagement',
  other:           'Other',
}

export function EmailClient({
  campaigns,
  emailListCount,
}: {
  campaigns: Campaign[]
  emailListCount: number
}) {
  const router = useRouter()
  const [addOpen,    setAddOpen]    = useState(false)
  const [advancing,  setAdvancing]  = useState<string | null>(null)

  async function markSent(id: string) {
    setAdvancing(id)
    const supabase = createClient()
    await supabase.from('email_campaigns').update({
      status:  'sent',
      sent_at: new Date().toISOString(),
    }).eq('id', id)
    router.refresh()
    setAdvancing(null)
  }

  const sentCount  = campaigns.filter(c => c.status === 'sent').length
  const draftCount = campaigns.filter(c => c.status === 'draft').length
  const avgOpenRate = campaigns
    .filter(c => c.open_rate != null)
    .reduce((sum, c, _, arr) => sum + (c.open_rate ?? 0) / arr.length, 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Email Campaigns</h2>
          <p className="text-sm text-muted mt-0.5">Brevo campaigns · track drafts and performance</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />New Campaign</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-terracotta">{emailListCount}</p>
          <p className="text-xs text-muted mt-0.5">
            <Mail size={10} className="inline mr-1" />
            Email List
          </p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{sentCount}</p>
          <p className="text-xs text-muted mt-0.5">Campaigns Sent</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          draftCount > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', draftCount > 0 ? 'text-amber-700' : 'text-espresso')}>
            {draftCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Drafts</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">
            {avgOpenRate > 0 ? formatPercent(avgOpenRate) : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Avg Open Rate</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-14 text-center">
          <Mail size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No campaigns yet</h3>
          <p className="text-muted text-sm mb-5">Track your Brevo email campaigns here.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} />Create First Campaign</Button>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/10 bg-espresso/5">
                <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Sent</th>
                <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Recipients</th>
                <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Open Rate</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {campaigns.map(c => (
                <tr key={c.id} className={cn('hover:bg-espresso/5 transition-colors', c.status === 'sent' && 'opacity-80')}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-espresso">{c.name}</p>
                    {c.subject && <p className="text-xs text-muted mt-0.5 truncate max-w-xs">{c.subject}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">
                    {TYPE_LABEL[c.campaign_type ?? ''] ?? c.campaign_type ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'muted'}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted tabular-nums whitespace-nowrap">
                    {c.sent_at ? formatDate(c.sent_at.split('T')[0], 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-espresso">
                    {c.recipient_count ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-espresso">
                    {c.open_rate != null ? formatPercent(c.open_rate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {c.status === 'draft' && (
                      <button
                        onClick={() => markSent(c.id)}
                        disabled={advancing === c.id}
                        className="text-terracotta hover:underline disabled:opacity-50"
                      >
                        {advancing === c.id ? '…' : 'Mark Sent'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && <AddCampaignModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
