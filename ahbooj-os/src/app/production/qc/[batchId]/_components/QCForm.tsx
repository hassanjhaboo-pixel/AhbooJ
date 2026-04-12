'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ExistingCheck {
  check_category: string | null
  check_name: string | null
  passed: boolean | null
  notes: string | null
}

interface QCFormProps {
  batchId: string
  currentActualYield: number | null
  currentQcNotes: string | null
  existingChecks: ExistingCheck[]
}

const QC_CHECKS: Array<{ category: string; categoryLabel: string; name: string }> = [
  { category: 'appearance', categoryLabel: 'Appearance',       name: 'Correct colour and visual appearance' },
  { category: 'appearance', categoryLabel: 'Appearance',       name: 'Proper texture and set' },
  { category: 'appearance', categoryLabel: 'Appearance',       name: 'Clean presentation, no defects' },
  { category: 'appearance', categoryLabel: 'Appearance',       name: 'Correct portion / fill level' },
  { category: 'taste',      categoryLabel: 'Taste & Flavour',  name: 'Flavour profile on target' },
  { category: 'taste',      categoryLabel: 'Taste & Flavour',  name: 'Sweetness level correct' },
  { category: 'packaging',  categoryLabel: 'Packaging & Storage', name: 'Properly sealed or wrapped' },
  { category: 'packaging',  categoryLabel: 'Packaging & Storage', name: 'Date labeled correctly' },
  { category: 'packaging',  categoryLabel: 'Packaging & Storage', name: 'Stored at correct temperature' },
]

type CheckState = true | false | null  // passed / failed / not checked

export function QCForm({ batchId, currentActualYield, currentQcNotes, existingChecks }: QCFormProps) {
  const router = useRouter()

  // Initialise checks from existing DB records
  const initialChecks: Record<string, CheckState> = {}
  for (const check of QC_CHECKS) {
    const existing = existingChecks.find(
      e => e.check_category === check.category && e.check_name === check.name
    )
    initialChecks[`${check.category}::${check.name}`] = existing?.passed ?? null
  }

  const [checks,      setChecks]      = useState<Record<string, CheckState>>(initialChecks)
  const [actualYield, setActualYield] = useState(currentActualYield?.toString() ?? '')
  const [qcNotes,     setQcNotes]     = useState(currentQcNotes ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  function setCheck(key: string, value: CheckState) {
    setChecks(prev => ({ ...prev, [key]: value }))
  }

  function passAll()  { setChecks(Object.fromEntries(Object.keys(checks).map(k => [k, true  as CheckState]))) }
  function clearAll() { setChecks(Object.fromEntries(Object.keys(checks).map(k => [k, null  as CheckState]))) }

  const checkedCount = Object.values(checks).filter(v => v !== null).length
  const failCount    = Object.values(checks).filter(v => v === false).length
  const overallPassed = checkedCount > 0 && failCount === 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (checkedCount === 0) {
      setError('Complete at least one check before submitting.')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()

    // Delete old QC log entries for this batch then insert fresh
    await supabase.from('production_qc_log').delete().eq('batch_id', batchId)

    const logEntries = QC_CHECKS
      .filter(c => checks[`${c.category}::${c.name}`] !== null)
      .map(c => ({
        batch_id:       batchId,
        check_category: c.category,
        check_name:     c.name,
        passed:         checks[`${c.category}::${c.name}`] as boolean,
      }))

    if (logEntries.length > 0) {
      const { error: logErr } = await supabase.from('production_qc_log').insert(logEntries)
      if (logErr) {
        setError(logErr.message)
        setSaving(false)
        return
      }
    }

    // Update batch with QC result + actual yield
    const { error: batchErr } = await supabase
      .from('production_batches')
      .update({
        qc_passed:    overallPassed,
        qc_notes:     qcNotes.trim() || null,
        actual_yield: parseInt(actualYield) || null,
      })
      .eq('id', batchId)

    if (batchErr) {
      setError(batchErr.message)
      setSaving(false)
      return
    }

    router.push('/production')
    router.refresh()
  }

  // Group checks by category
  const categories = [...new Set(QC_CHECKS.map(c => c.category))]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Actual yield */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <h3 className="font-display font-semibold text-espresso mb-4">Production Outcome</h3>
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-muted mb-1.5">Actual Yield (units)</label>
          <input
            type="number" min="0" step="1"
            value={actualYield} onChange={e => setActualYield(e.target.value)}
            className="w-full rounded-lg border border-espresso/20 bg-warm-white px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            placeholder="How many units were produced?"
          />
        </div>
      </div>

      {/* QC checklist */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-espresso">Quality Checks</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={passAll}  className="text-xs text-status-green hover:underline">Pass all</button>
            <span className="text-muted">·</span>
            <button type="button" onClick={clearAll} className="text-xs text-muted hover:underline">Clear</button>
          </div>
        </div>

        <div className="space-y-5">
          {categories.map(cat => {
            const catChecks = QC_CHECKS.filter(c => c.category === cat)
            const catLabel  = catChecks[0].categoryLabel
            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{catLabel}</p>
                <div className="space-y-1.5">
                  {catChecks.map(check => {
                    const key   = `${check.category}::${check.name}`
                    const state = checks[key]
                    return (
                      <div key={key} className={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors',
                        state === true  ? 'bg-status-green/10' :
                        state === false ? 'bg-status-red/10'   : 'bg-espresso/5'
                      )}>
                        <span className="text-sm text-espresso">{check.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                          <button
                            type="button"
                            title="Pass"
                            onClick={() => setCheck(key, state === true ? null : true)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              state === true ? 'text-status-green' : 'text-muted/40 hover:text-status-green'
                            )}
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            type="button"
                            title="Fail"
                            onClick={() => setCheck(key, state === false ? null : false)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              state === false ? 'text-status-red' : 'text-muted/40 hover:text-status-red'
                            )}
                          >
                            <XCircle size={18} />
                          </button>
                          <button
                            type="button"
                            title="Skip"
                            onClick={() => setCheck(key, null)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              state === null ? 'text-muted' : 'text-muted/30 hover:text-muted'
                            )}
                          >
                            <MinusCircle size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {checkedCount > 0 && (
          <div className={cn(
            'mt-4 rounded-lg p-3 text-sm font-medium',
            overallPassed ? 'bg-status-green/15 text-status-green' : 'bg-status-red/15 text-status-red'
          )}>
            {overallPassed
              ? `✓ ${checkedCount} checks passed — batch will be marked QC Passed`
              : `✗ ${failCount} check${failCount !== 1 ? 's' : ''} failed — batch will be marked QC Failed`}
          </div>
        )}
      </div>

      {/* QC notes */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <label className="block text-xs font-medium text-muted mb-1.5">QC Notes (optional)</label>
        <textarea
          value={qcNotes} onChange={e => setQcNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-espresso/20 bg-warm-white px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
          placeholder="Any observations, issues, or improvements…"
        />
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push('/production')}>Back</Button>
        <Button type="submit" disabled={saving || checkedCount === 0}>
          {saving ? 'Saving…' : 'Submit QC Review'}
        </Button>
      </div>
    </form>
  )
}
