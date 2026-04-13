import Link from 'next/link'
import { Sparkles, Megaphone, DollarSign, Lightbulb, BarChart2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'

type AgentRun = {
  id: string
  agent_type: string
  tokens_used: number | null
  run_at: string
}

const AGENTS = [
  {
    type:        'marketing',
    href:        '/agents/marketing',
    label:       'Marketing Agent',
    description: 'WhatsApp broadcasts & Instagram captions',
    icon:        Megaphone,
    colour:      'text-status-green',
    bg:          'bg-status-green/10',
  },
  {
    type:        'pricing',
    href:        '/agents/pricing',
    label:       'Pricing Agent',
    description: 'Margin review & price recommendations',
    icon:        DollarSign,
    colour:      'text-gold',
    bg:          'bg-gold/10',
  },
  {
    type:        'product-discovery',
    href:        '/agents/product-discovery',
    label:       'Product Discovery',
    description: 'New product ideas & seasonal specials',
    icon:        Lightbulb,
    colour:      'text-terracotta',
    bg:          'bg-terracotta/10',
  },
  {
    type:        'weekly-review',
    href:        '/agents/weekly-review',
    label:       'Weekly Review',
    description: 'Monday morning business summary',
    icon:        BarChart2,
    colour:      'text-espresso',
    bg:          'bg-espresso/10',
  },
]

export default async function AgentsPage() {
  const supabase = await createClient()

  const { data: runData } = await supabase
    .from('agent_runs')
    .select('id, agent_type, tokens_used, run_at')
    .order('run_at', { ascending: false })
    .limit(20) as unknown as { data: AgentRun[] | null }

  const runs        = runData ?? []
  const totalRuns   = runs.length
  const totalTokens = runs.reduce((s, r) => s + (r.tokens_used ?? 0), 0)
  const recentRuns  = runs.slice(0, 5)

  // Last run per agent
  const lastRunMap: Record<string, AgentRun> = {}
  for (const r of runs) {
    if (!lastRunMap[r.agent_type]) lastRunMap[r.agent_type] = r
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-gold" />
          <h2 className="font-display text-2xl font-semibold text-espresso">AI Agents</h2>
        </div>
        <p className="text-sm text-muted">Claude-powered tools that analyse your business data and take action</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{totalRuns}</p>
          <p className="text-xs text-muted mt-0.5">Total Runs</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">
            {totalTokens > 0 ? totalTokens.toLocaleString() : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Tokens Used</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Agent cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AGENTS.map(({ type, href, label, description, icon: Icon, colour, bg }) => {
            const last = lastRunMap[type]
            return (
              <Link
                key={type}
                href={href}
                className="bg-cream rounded-card shadow-card border border-cream/60 p-5 hover:border-terracotta/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={19} className={colour} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-espresso">{label}</p>
                  </div>
                </div>
                <p className="text-xs text-muted mb-3">{description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-terracotta font-medium">Run Agent →</span>
                  {last && (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(last.run_at.split('T')[0], 'MMM d')}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Recent runs */}
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center gap-2">
            <Clock size={14} className="text-muted" />
            <h3 className="font-display font-semibold text-espresso text-sm">Recent Activity</h3>
          </div>
          {recentRuns.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">
              No runs yet. Pick an agent above to get started.
            </div>
          ) : (
            <div className="divide-y divide-espresso/5">
              {recentRuns.map(r => {
                const agent = AGENTS.find(a => a.type === r.agent_type)
                return (
                  <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                    {agent && (
                      <div className={`w-7 h-7 rounded-lg ${agent.bg} flex items-center justify-center flex-shrink-0`}>
                        <agent.icon size={13} className={agent.colour} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-espresso font-medium truncate">{agent?.label ?? r.agent_type}</p>
                      <p className="text-xs text-muted">
                        {formatDate(r.run_at.split('T')[0], 'MMM d, yyyy')}
                        {r.tokens_used ? ` · ${r.tokens_used.toLocaleString()} tokens` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
