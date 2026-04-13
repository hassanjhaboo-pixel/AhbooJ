'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const CAMPAIGN_TYPES = ['newsletter', 'product-launch', 'seasonal', 'promo', 're-engagement', 'other']

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function AddCampaignModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const [name,         setName]         = useState('')
  const [subject,      setSubject]      = useState('')
  const [campaignType, setCampaignType] = useState('newsletter')
  const [bodyText,     setBodyText]     = useState('')
  const [brevoId,      setBrevoId]      = useState('')
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('email_campaigns').insert({
      name:               name.trim(),
      subject:            subject.trim()  || null,
      campaign_type:      campaignType,
      body_text:          bodyText.trim() || null,
      brevo_campaign_id:  brevoId.trim()  || null,
      notes:              notes.trim()    || null,
      status:             'draft',
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">New Email Campaign</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Campaign Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. April Newsletter, Easter Launch…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select value={campaignType} onChange={e => setCampaignType(e.target.value)} className={inputCls}>
                {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Brevo Campaign ID</label>
              <input type="text" value={brevoId} onChange={e => setBrevoId(e.target.value)} className={inputCls} placeholder="Optional reference" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Subject Line</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="e.g. 🌸 New Flavours Just Dropped…" />
          </div>
          <div>
            <label className={labelCls}>Plain Text Preview / Notes</label>
            <textarea
              rows={4}
              value={bodyText}
              onChange={e => setBodyText(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Draft copy, key messaging points…"
            />
          </div>
          <div>
            <label className={labelCls}>Internal Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Goals, audience, timing rationale…" />
          </div>
          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Create Draft'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
