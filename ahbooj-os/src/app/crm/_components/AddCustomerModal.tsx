'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const CHANNELS = ['direct', 'instagram', 'whatsapp', 'market', 'referral']

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [instagram, setInstagram] = useState('')
  const [channel,   setChannel]   = useState('direct')
  const [whatsapp,  setWhatsapp]  = useState(false)
  const [emailList, setEmailList] = useState(false)
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: insertErr } = await supabase
      .from('customers')
      .insert({
        name:             name.trim(),
        phone:            phone.trim()     || null,
        email:            email.trim()     || null,
        instagram_handle: instagram.trim() || null,
        channel,
        on_whatsapp_list: whatsapp,
        on_email_list:    emailList,
        notes:            notes.trim()     || null,
      })

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso">Add Customer</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Melissa Ali" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+1 868 …" />
            </div>
            <div>
              <label className={labelCls}>Instagram</label>
              <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} className={inputCls} placeholder="@handle" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@example.com" />
            </div>
            <div>
              <label className={labelCls}>Channel</label>
              <select value={channel} onChange={e => setChannel(e.target.value)} className={inputCls}>
                {CHANNELS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>

          {/* List memberships */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)} className="rounded border-espresso/20 text-terracotta focus:ring-terracotta/40" />
              <span className="text-sm text-espresso">WhatsApp list</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={emailList} onChange={e => setEmailList(e.target.checked)} className="rounded border-espresso/20 text-terracotta focus:ring-terracotta/40" />
              <span className="text-sm text-espresso">Email list</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Allergies, preferences, referral source…" />
          </div>

          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Add Customer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
