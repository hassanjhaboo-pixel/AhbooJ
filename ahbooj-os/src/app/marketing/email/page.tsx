import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { EmailClient } from './_components/EmailClient'

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

export default async function EmailCampaignsPage() {
  const supabase = await createClient()

  const { data: campaignData } = await supabase
    .from('email_campaigns')
    .select('id, name, subject, campaign_type, status, sent_at, recipient_count, open_rate, notes')
    .order('created_at', { ascending: false }) as unknown as { data: Campaign[] | null }

  const { count: emailListCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('on_email_list', true) as unknown as { count: number | null }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/marketing" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Marketing
        </Link>
      </div>
      <EmailClient
        campaigns={campaignData ?? []}
        emailListCount={emailListCount ?? 0}
      />
    </PageWrapper>
  )
}
