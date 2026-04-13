import Link from 'next/link'
import { MessageCircle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatPercent } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type RecentBroadcast = {
  id: string
  broadcast_date: string
  message_text: string
  products_featured: string[] | null
  sent: boolean
  estimated_reach: number | null
}

type RecentCampaign = {
  id: string
  name: string
  campaign_type: string | null
  status: string
  sent_at: string | null
  open_rate: number | null
}

export default async function MarketingPage() {
  const supabase = await createClient()

  const { count: whatsappCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('on_whatsapp_list', true) as unknown as { count: number | null }

  const { count: emailCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('on_email_list', true) as unknown as { count: number | null }

  const { data: broadcastData } = await supabase
    .from('broadcasts')
    .select('id, broadcast_date, message_text, products_featured, sent, estimated_reach')
    .order('broadcast_date', { ascending: false })
    .limit(5) as unknown as { data: RecentBroadcast[] | null }

  const { data: campaignData } = await supabase
    .from('email_campaigns')
    .select('id, name, campaign_type, status, sent_at, open_rate')
    .order('created_at', { ascending: false })
    .limit(5) as unknown as { data: RecentCampaign[] | null }

  const broadcasts      = broadcastData ?? []
  const campaigns       = campaignData ?? []
  const broadcastsSent  = broadcasts.filter(b => b.sent).length
  const campaignsSent   = campaigns.filter(c => c.status === 'sent').length
  const pendingDrafts   = broadcasts.filter(b => !b.sent).length + campaigns.filter(c => c.status === 'draft').length

  return (
    <PageWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">Marketing</h2>
        <p className="text-sm text-muted mt-0.5">Broadcasts &amp; email campaigns</p>
      </div>

      {/* Audience stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-status-green">{whatsappCount ?? 0}</p>
          <p className="text-xs text-muted mt-0.5 flex items-center justify-center gap-1">
            <MessageCircle size={10} />WhatsApp List
          </p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-terracotta">{emailCount ?? 0}</p>
          <p className="text-xs text-muted mt-0.5 flex items-center justify-center gap-1">
            <Mail size={10} />Email List
          </p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{broadcastsSent + campaignsSent}</p>
          <p className="text-xs text-muted mt-0.5">Messages Sent</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          pendingDrafts > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', pendingDrafts > 0 ? 'text-amber-700' : 'text-espresso')}>
            {pendingDrafts}
          </p>
          <p className="text-xs text-muted mt-0.5">Pending Drafts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent broadcasts */}
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={15} className="text-status-green" />
              <h3 className="font-display font-semibold text-espresso text-sm">Recent Broadcasts</h3>
            </div>
            <Link href="/marketing/broadcast" className="text-xs text-terracotta hover:underline">
              All broadcasts →
            </Link>
          </div>
          {broadcasts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">
              No broadcasts yet.{' '}
              <Link href="/marketing/broadcast" className="text-terracotta hover:underline">Compose one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-espresso/5">
              {broadcasts.map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso">
                      {formatDate(b.broadcast_date, 'EEE, MMM d')}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {b.products_featured?.join(' · ') ?? b.message_text.slice(0, 60) + '…'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {b.estimated_reach != null && (
                      <span className="text-xs text-muted">~{b.estimated_reach}</span>
                    )}
                    <Badge variant={b.sent ? 'green' : 'amber'}>{b.sent ? 'Sent' : 'Draft'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent email campaigns */}
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-terracotta" />
              <h3 className="font-display font-semibold text-espresso text-sm">Email Campaigns</h3>
            </div>
            <Link href="/marketing/email" className="text-xs text-terracotta hover:underline">
              All campaigns →
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">
              No campaigns yet.{' '}
              <Link href="/marketing/email" className="text-terracotta hover:underline">Create one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-espresso/5">
              {campaigns.map(c => (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso">{c.name}</p>
                    <p className="text-xs text-muted mt-0.5 capitalize">
                      {c.campaign_type?.replace(/-/g, ' ') ?? 'campaign'}
                      {c.sent_at && ` · ${formatDate(c.sent_at.split('T')[0], 'MMM d')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.open_rate != null && (
                      <span className="text-xs text-muted">{formatPercent(c.open_rate)} open</span>
                    )}
                    <Badge variant={c.status === 'sent' ? 'green' : 'amber'}>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
