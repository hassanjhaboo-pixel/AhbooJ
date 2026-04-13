import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AgentRunner } from '../_components/AgentRunner'

type AgentRun = { id: string; output: string | null; tokens_used: number | null; run_at: string }

export default async function PricingAgentPage() {
  const supabase = await createClient()

  const { data: runs } = await supabase
    .from('agent_runs')
    .select('id, output, tokens_used, run_at')
    .eq('agent_type', 'pricing')
    .order('run_at', { ascending: false })
    .limit(10) as unknown as { data: AgentRun[] | null }

  return (
    <PageWrapper>
      <AgentRunner
        agentType="pricing"
        title="Pricing Agent"
        description="Reviews all active product margins and gives specific recommendations to fix problem pricing and capture pricing opportunities."
        hint="Reads every active product's cost, direct price, café price, and computed margins. Flags anything below the margin floor and suggests concrete price changes in TT$."
        runs={runs ?? []}
      />
    </PageWrapper>
  )
}
