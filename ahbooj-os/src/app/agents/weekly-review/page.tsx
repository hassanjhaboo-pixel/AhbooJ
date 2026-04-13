import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AgentRunner } from '../_components/AgentRunner'

type AgentRun = { id: string; output: string | null; tokens_used: number | null; run_at: string }

export default async function WeeklyReviewAgentPage() {
  const supabase = await createClient()

  const { data: runs } = await supabase
    .from('agent_runs')
    .select('id, output, tokens_used, run_at')
    .eq('agent_type', 'weekly-review')
    .order('run_at', { ascending: false })
    .limit(10) as unknown as { data: AgentRun[] | null }

  return (
    <PageWrapper>
      <AgentRunner
        agentType="weekly-review"
        title="Weekly Review Agent"
        description="Produces a Monday morning business review: key metrics, wins, watch-list items, 3 action items, and one big strategic idea."
        hint="Scans the last 7 days of orders, production batches, QC results, new customers, open partner invoices, and MTD finance figures to give you a clear picture of the week."
        runs={runs ?? []}
      />
    </PageWrapper>
  )
}
