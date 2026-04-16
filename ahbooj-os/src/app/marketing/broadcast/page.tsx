import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { BroadcastClient } from './_components/BroadcastClient'

type Broadcast = {
  id: string
  broadcast_date: string
  message_text: string
  products_featured: string[] | null
  sent: boolean
  estimated_reach: number | null
  notes: string | null
}

export default async function BroadcastPage() {
  const supabase = await createClient()

  const { data: broadcastData } = await supabase
    .from('broadcasts')
    .select('id, broadcast_date, message_text, products_featured, sent, estimated_reach, notes')
    .order('broadcast_date', { ascending: false }) as unknown as { data: Broadcast[] | null }

  const { count: whatsappCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('on_whatsapp_list', true) as unknown as { count: number | null }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/marketing" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Marketing
        </Link>
      </div>
      <BroadcastClient
        broadcasts={broadcastData ?? []}
        whatsappCount={whatsappCount ?? 0}
      />
    </PageWrapper>
  )
}
