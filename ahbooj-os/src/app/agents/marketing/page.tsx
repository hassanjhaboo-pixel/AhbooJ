import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AgentRunner } from '../_components/AgentRunner'

type AgentRun = { id: string; output: string | null; tokens_used: number | null; run_at: string }

export default async function MarketingAgentPage() {
  const supabase = await createClient()

  const { data: runs } = await supabase
    .from('agent_runs')
    .select('id, output, tokens_used, run_at')
    .eq('agent_type', 'marketing')
    .order('run_at', { ascending: false })
    .limit(10) as unknown as { data: AgentRun[] | null }

  return (
    <PageWrapper>
      <AgentRunner
        agentType="marketing"
        title="Marketing Agent"
        description="Generates WhatsApp broadcast copy and Instagram captions based on your current products and recent sales."
        hint="Pulls your active product list, WhatsApp list size, top-selling products, and recent broadcast messages to generate a ready-to-send Friday pick-up message + social captions."
        runs={runs ?? []}
      />
    </PageWrapper>
  )
}
