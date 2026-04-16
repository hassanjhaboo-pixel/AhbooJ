import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AgentRunner } from '../_components/AgentRunner'

type AgentRun = { id: string; output: string | null; tokens_used: number | null; run_at: string }

export default async function ProductDiscoveryAgentPage() {
  const supabase = await createClient()

  const { data: runs } = await supabase
    .from('agent_runs')
    .select('id, output, tokens_used, run_at')
    .eq('agent_type', 'product-discovery')
    .order('run_at', { ascending: false })
    .limit(10) as unknown as { data: AgentRun[] | null }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          Agents
        </Link>
      </div>
      <AgentRunner
        agentType="product-discovery"
        title="Product Discovery Agent"
        description="Suggests new product ideas, limited-time specials, and recipe variations based on what's selling, what's in stock, and the current season."
        hint="Analyses your active products, recipes, well-stocked ingredients, and top-selling items. Considers T&T seasons and holidays (Carnival, Divali, Christmas, beach season) for timely ideas."
        runs={runs ?? []}
      />
    </PageWrapper>
  )
}
