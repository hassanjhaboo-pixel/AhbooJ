'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Check, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ComposeBroadcastModal } from './ComposeBroadcastModal'

type Broadcast = {
  id: string
  broadcast_date: string
  message_text: string
  products_featured: string[] | null
  sent: boolean
  estimated_reach: number | null
  notes: string | null
}

export function BroadcastClient({
  broadcasts,
  whatsappCount,
}: {
  broadcasts: Broadcast[]
  whatsappCount: number
}) {
  const router    = useRouter()
  const [composeOpen, setComposeOpen]  = useState(false)
  const [expanded,    setExpanded]     = useState<string | null>(null)
  const [copied,      setCopied]       = useState<string | null>(null)
  const [marking,     setMarking]      = useState<string | null>(null)

  async function markSent(id: string) {
    setMarking(id)
    const supabase = createClient()
    await supabase.from('broadcasts').update({ sent: true }).eq('id', id)
    router.refresh()
    setMarking(null)
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const sentCount  = broadcasts.filter(b => b.sent).length
  const draftCount = broadcasts.filter(b => !b.sent).length

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">WhatsApp Broadcasts</h2>
          <p className="text-sm text-muted mt-0.5">Friday pick-up messages to your list</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}><Plus size={16} />Compose</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-status-green">{whatsappCount}</p>
          <p className="text-xs text-muted mt-0.5">
            <MessageCircle size={10} className="inline mr-1" />
            WhatsApp List
          </p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{sentCount}</p>
          <p className="text-xs text-muted mt-0.5">Broadcasts Sent</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          draftCount > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', draftCount > 0 ? 'text-amber-700' : 'text-espresso')}>{draftCount}</p>
          <p className="text-xs text-muted mt-0.5">Drafts Ready</p>
        </div>
      </div>

      {broadcasts.length === 0 ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-14 text-center">
          <MessageCircle size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No broadcasts yet</h3>
          <p className="text-muted text-sm mb-5">Compose your first Friday broadcast message.</p>
          <Button onClick={() => setComposeOpen(true)}><Plus size={16} />Compose First Broadcast</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(b => (
            <div
              key={b.id}
              className={cn(
                'bg-cream rounded-card shadow-card border overflow-hidden',
                b.sent ? 'border-cream/60 opacity-80' : 'border-status-amber/30'
              )}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <button
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-espresso">
                        {formatDate(b.broadcast_date, 'EEEE, MMM d, yyyy')}
                      </span>
                      <Badge variant={b.sent ? 'green' : 'amber'}>{b.sent ? 'Sent' : 'Draft'}</Badge>
                      {b.estimated_reach != null && (
                        <span className="text-xs text-muted">~{b.estimated_reach} recipients</span>
                      )}
                    </div>
                    {b.products_featured && b.products_featured.length > 0 && (
                      <p className="text-xs text-muted truncate">
                        {b.products_featured.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-muted text-xs">{expanded === b.id ? '▲' : '▼'}</span>
                </button>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyText(b.id, b.message_text)}
                    title="Copy message"
                    className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted transition-colors"
                  >
                    {copied === b.id ? <Check size={15} className="text-status-green" /> : <Copy size={15} />}
                  </button>
                  {!b.sent && (
                    <button
                      onClick={() => markSent(b.id)}
                      disabled={marking === b.id}
                      className="text-xs text-terracotta hover:underline disabled:opacity-50 whitespace-nowrap"
                    >
                      {marking === b.id ? '…' : 'Mark Sent'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded message */}
              {expanded === b.id && (
                <div className="border-t border-espresso/10 px-5 py-4">
                  <pre className="text-xs text-espresso whitespace-pre-wrap font-sans leading-relaxed bg-warm-white rounded-lg p-4 border border-espresso/10">
                    {b.message_text}
                  </pre>
                  {b.notes && (
                    <p className="text-xs text-muted mt-3 italic">Note: {b.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {composeOpen && (
        <ComposeBroadcastModal
          whatsappCount={whatsappCount}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </>
  )
}
