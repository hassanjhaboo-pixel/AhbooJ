'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Copy, Check, Clock, Zap } from 'lucide-react'
import { formatDate } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type AgentRun = {
  id: string
  output: string | null
  tokens_used: number | null
  run_at: string
}

interface Props {
  agentType: string
  title: string
  description: string
  hint: string
  runs: AgentRun[]
}

export function AgentRunner({ agentType, title, description, hint, runs }: Props) {
  const router  = useRouter()
  const [running,   setRunning]   = useState(false)
  const [output,    setOutput]    = useState<string | null>(null)
  const [tokens,    setTokens]    = useState<number | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [copied,    setCopied]    = useState(false)
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null)

  async function runAgent() {
    setRunning(true)
    setOutput(null)
    setError(null)
    setActiveRun(null)

    try {
      const res = await fetch(`/api/agents/${agentType}`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Agent failed to run.')
      } else {
        setOutput(data.output)
        setTokens(data.tokens_used ?? null)
        router.refresh()
      }
    } catch {
      setError('Network error — could not reach the agent.')
    } finally {
      setRunning(false)
    }
  }

  async function copyOutput(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayOutput = output ?? activeRun?.output ?? null
  const displayTokens = tokens ?? activeRun?.tokens_used ?? null

  return (
    <div className="space-y-5">
      {/* Agent card */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-gold" />
              <h2 className="font-display text-xl font-semibold text-espresso">{title}</h2>
            </div>
            <p className="text-sm text-muted">{description}</p>
          </div>
          <Button
            onClick={runAgent}
            disabled={running}
            className={cn(running && 'opacity-80')}
          >
            {running ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Running…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Zap size={15} />
                Run Agent
              </span>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted bg-espresso/5 rounded-lg px-4 py-2.5 italic">
          💡 {hint}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 text-sm text-status-red">
          {error}
        </div>
      )}

      {/* Output */}
      {displayOutput && (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-espresso/10">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-gold" />
              <span className="text-sm font-medium text-espresso">Agent Output</span>
              {displayTokens && (
                <span className="text-xs text-muted ml-1">· {displayTokens.toLocaleString()} tokens</span>
              )}
            </div>
            <button
              onClick={() => copyOutput(displayOutput)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-espresso transition-colors p-1.5 rounded-lg hover:bg-espresso/5"
            >
              {copied ? <Check size={13} className="text-status-green" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="px-5 py-4">
            <pre className="text-sm text-espresso whitespace-pre-wrap font-sans leading-relaxed">
              {displayOutput}
            </pre>
          </div>
        </div>
      )}

      {/* Run history */}
      {runs.length > 0 && (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center gap-2">
            <Clock size={14} className="text-muted" />
            <h3 className="font-display font-semibold text-espresso text-sm">Previous Runs</h3>
            <span className="text-xs text-muted">({runs.length})</span>
          </div>
          <div className="divide-y divide-espresso/5">
            {runs.map(run => (
              <button
                key={run.id}
                onClick={() => {
                  setActiveRun(activeRun?.id === run.id ? null : run)
                  setOutput(null)
                  setError(null)
                }}
                className="w-full text-left px-5 py-3 hover:bg-espresso/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-espresso">
                    {formatDate(run.run_at.split('T')[0], 'EEE, MMM d, yyyy')}
                    {' '}
                    <span className="text-muted text-xs">
                      {run.run_at.split('T')[1]?.slice(0, 5)}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {run.tokens_used && (
                      <span className="text-xs text-muted">{run.tokens_used.toLocaleString()} tokens</span>
                    )}
                    <span className="text-xs text-terracotta">
                      {activeRun?.id === run.id ? 'Hide ▲' : 'View ▼'}
                    </span>
                  </div>
                </div>
                {activeRun?.id === run.id && run.output && (
                  <pre className="mt-3 text-sm text-espresso whitespace-pre-wrap font-sans leading-relaxed text-left bg-warm-white rounded-lg p-4 border border-espresso/10">
                    {run.output}
                  </pre>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
