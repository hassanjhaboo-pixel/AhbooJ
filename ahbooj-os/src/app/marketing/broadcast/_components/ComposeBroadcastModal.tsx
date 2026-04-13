'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const inputCls  = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls  = 'block text-xs font-medium text-muted mb-1.5'

export function ComposeBroadcastModal({
  whatsappCount,
  onClose,
}: {
  whatsappCount: number
  onClose: () => void
}) {
  const router = useRouter()
  const today  = new Date().toISOString().split('T')[0]

  const [broadcastDate,    setBroadcastDate]    = useState(today)
  const [messageText,      setMessageText]      = useState('')
  const [productsFeatured, setProductsFeatured] = useState('')
  const [estimatedReach,   setEstimatedReach]   = useState(String(whatsappCount))
  const [notes,            setNotes]            = useState('')
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState('')

  const charCount = messageText.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim()) return
    setSaving(true)
    setError('')

    const products = productsFeatured
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const supabase = createClient()
    const { error: err } = await supabase.from('broadcasts').insert({
      broadcast_date:    broadcastDate,
      message_text:      messageText.trim(),
      products_featured: products.length > 0 ? products : null,
      estimated_reach:   estimatedReach ? parseInt(estimatedReach) : null,
      notes:             notes.trim() || null,
      sent:              false,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Compose Broadcast</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={broadcastDate} onChange={e => setBroadcastDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estimated Reach</label>
              <input type="number" min="0" value={estimatedReach} onChange={e => setEstimatedReach(e.target.value)} className={inputCls} placeholder={String(whatsappCount)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Products Featured (comma-separated)</label>
            <input
              type="text" value={productsFeatured} onChange={e => setProductsFeatured(e.target.value)}
              className={inputCls} placeholder="Coconut Rum Cake, Guava Cheesecake…"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace('mb-1.5', '')}>Message Text *</label>
              <span className={`text-xs ${charCount > 1000 ? 'text-status-red' : 'text-muted'}`}>{charCount} chars</span>
            </div>
            <textarea
              required
              rows={8}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
              placeholder={`✨ Friday Pick-Up is HERE! ✨\n\nHey love! 🌺\n\n[Your message here…]\n\nReply to this message to place your order!\n💛 AhbooJ Desserts`}
            />
          </div>
          <div>
            <label className={labelCls}>Internal Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Strategy notes, AB test idea…" />
          </div>
          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving || !messageText.trim()}>
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
