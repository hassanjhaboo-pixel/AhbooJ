'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  instagram_handle: string | null
  channel: string
  on_whatsapp_list: boolean
  on_email_list: boolean
  notes: string | null
  is_active: boolean
}

const CHANNELS = ['direct', 'instagram', 'whatsapp', 'market', 'referral']

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-warm-white px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function CustomerEditForm({ customer }: { customer: Customer }) {
  const router = useRouter()

  const [name,      setName]      = useState(customer.name)
  const [phone,     setPhone]     = useState(customer.phone ?? '')
  const [email,     setEmail]     = useState(customer.email ?? '')
  const [instagram, setInstagram] = useState(customer.instagram_handle ?? '')
  const [channel,   setChannel]   = useState(customer.channel)
  const [whatsapp,  setWhatsapp]  = useState(customer.on_whatsapp_list)
  const [emailList, setEmailList] = useState(customer.on_email_list)
  const [notes,     setNotes]     = useState(customer.notes ?? '')
  const [isActive,  setIsActive]  = useState(customer.is_active)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        name:             name.trim(),
        phone:            phone.trim()     || null,
        email:            email.trim()     || null,
        instagram_handle: instagram.trim() || null,
        channel,
        on_whatsapp_list: whatsapp,
        on_email_list:    emailList,
        notes:            notes.trim()     || null,
        is_active:        isActive,
      })
      .eq('id', customer.id)

    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Contact Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+1 868 …" />
          </div>
          <div>
            <label className={labelCls}>Instagram</label>
            <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} className={inputCls} placeholder="@handle" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} className={inputCls}>
              {CHANNELS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-3">
        <h3 className="font-display font-semibold text-espresso">Lists & Status</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-espresso font-medium">WhatsApp Broadcast List</p>
              <p className="text-xs text-muted">Include in Friday broadcast messages</p>
            </div>
            <button
              type="button"
              onClick={() => setWhatsapp(v => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
                whatsapp ? 'bg-status-green' : 'bg-espresso/20'
              )}
            >
              <span className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                whatsapp ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-espresso font-medium">Email Marketing List</p>
              <p className="text-xs text-muted">Receive email campaigns via Brevo</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailList(v => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
                emailList ? 'bg-terracotta' : 'bg-espresso/20'
              )}
            >
              <span className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                emailList ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-espresso font-medium">Active Customer</p>
              <p className="text-xs text-muted">Uncheck to archive without deleting</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
                isActive ? 'bg-espresso' : 'bg-espresso/20'
              )}
            >
              <span className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                isActive ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
          </label>
        </div>
      </div>

      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <label className={labelCls}>Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={3}
          className={cn(inputCls, 'resize-none')}
          placeholder="Allergies, preferences, how they found you, referral details…"
        />
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">{error}</div>
      )}
      {saved && (
        <div className="bg-status-green/10 border border-status-green/30 rounded-lg p-3 text-sm text-status-green">Changes saved.</div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push('/crm')}>Back to CRM</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
      </div>
    </form>
  )
}
