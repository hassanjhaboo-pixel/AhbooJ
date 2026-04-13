'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Partner {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  payment_terms: string
  notes: string | null
  is_active: boolean
}

const PAYMENT_TERMS = ['Net 7', 'Net 14', 'Net 30', 'Net 60', 'COD', 'Prepaid']

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-warm-white px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function PartnerEditForm({ partner }: { partner: Partner }) {
  const router = useRouter()

  const [name,         setName]         = useState(partner.name)
  const [contactName,  setContactName]  = useState(partner.contact_name ?? '')
  const [phone,        setPhone]        = useState(partner.phone ?? '')
  const [email,        setEmail]        = useState(partner.email ?? '')
  const [address,      setAddress]      = useState(partner.address ?? '')
  const [paymentTerms, setPaymentTerms] = useState(partner.payment_terms)
  const [notes,        setNotes]        = useState(partner.notes ?? '')
  const [isActive,     setIsActive]     = useState(partner.is_active)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('partners')
      .update({
        name:          name.trim(),
        contact_name:  contactName.trim() || null,
        phone:         phone.trim()       || null,
        email:         email.trim()       || null,
        address:       address.trim()     || null,
        payment_terms: paymentTerms,
        notes:         notes.trim()       || null,
        is_active:     isActive,
      })
      .eq('id', partner.id)

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
        <h3 className="font-display font-semibold text-espresso">Partner Details</h3>
        <div>
          <label className={labelCls}>Business Name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Contact Person</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className={inputCls} placeholder="Full name" />
          </div>
          <div>
            <label className={labelCls}>Payment Terms</label>
            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={inputCls}>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+1 868 …" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} placeholder="Delivery / billing address" />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            rows={3}
            className={cn(inputCls, 'resize-none')}
            placeholder="Preferred products, schedule, special requirements…"
          />
        </div>
      </div>

      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <h3 className="font-display font-semibold text-espresso mb-3">Status</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm text-espresso font-medium">Active Partner</p>
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

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">{error}</div>
      )}
      {saved && (
        <div className="bg-status-green/10 border border-status-green/30 rounded-lg p-3 text-sm text-status-green">Changes saved.</div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push('/partners')}>Back</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
      </div>
    </form>
  )
}
