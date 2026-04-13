'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const PAYMENT_TERMS = ['Net 7', 'Net 14', 'Net 30', 'Net 60', 'COD', 'Prepaid']

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

export function AddPartnerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const [name,         setName]         = useState('')
  const [contactName,  setContactName]  = useState('')
  const [phone,        setPhone]        = useState('')
  const [email,        setEmail]        = useState('')
  const [address,      setAddress]      = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Net 14')
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: insertErr } = await supabase
      .from('partners')
      .insert({
        name:          name.trim(),
        contact_name:  contactName.trim() || null,
        phone:         phone.trim()       || null,
        email:         email.trim()       || null,
        address:       address.trim()     || null,
        payment_terms: paymentTerms,
        notes:         notes.trim()       || null,
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
          <h3 className="font-display font-semibold text-espresso">Add Partner</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-espresso/5 text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Business Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Kafneo Coffee" />
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
            <label className={labelCls}>Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Preferred products, schedule, special requirements…" />
          </div>

          {error && <p className="text-xs text-status-red bg-status-red/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Add Partner'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
