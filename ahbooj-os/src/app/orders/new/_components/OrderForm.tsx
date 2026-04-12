'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTTD } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone: string | null
}

interface Product {
  id: string
  name: string
  sku: string | null
  direct_price: number | null
  cafe_price: number | null
}

interface LineItem {
  key: number
  product_id: string
  qty: string
  unit_price: string
}

const CHANNELS = [
  { value: 'direct',    label: 'Direct' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'market',    label: 'Market' },
  { value: 'referral',  label: 'Referral' },
]

const STATUSES = [
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
]

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-warm-white px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

function genOrderNumber(): string {
  const d = new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${ymd}-${rand}`
}

export function OrderForm({ customers, products }: { customers: Customer[]; products: Product[] }) {
  const router = useRouter()
  let nextKey = 1

  // Customer
  const [customerId,   setCustomerId]   = useState('')
  const [newName,      setNewName]      = useState('')
  const [newPhone,     setNewPhone]     = useState('')
  const [newEmail,     setNewEmail]     = useState('')
  const [newInstagram, setNewInstagram] = useState('')

  // Order meta
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [channel,   setChannel]   = useState('direct')
  const [status,    setStatus]    = useState('confirmed')
  const [notes,     setNotes]     = useState('')

  // Line items
  const [rows, setRows] = useState<LineItem[]>([
    { key: 0, product_id: '', qty: '1', unit_price: '' },
  ])

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Derived
  const isNewCustomer = customerId === 'new'

  function addRow() {
    setRows(r => [...r, { key: nextKey++, product_id: '', qty: '1', unit_price: '' }])
  }

  function removeRow(key: number) {
    setRows(r => r.filter(row => row.key !== key))
  }

  function updateRow(key: number, field: keyof LineItem, value: string) {
    setRows(r => r.map(row => {
      if (row.key !== key) return row
      const updated = { ...row, [field]: value }
      // Auto-fill price when product changes
      if (field === 'product_id' && value) {
        const p = products.find(p => p.id === value)
        if (p) updated.unit_price = (p.direct_price ?? p.cafe_price ?? '').toString()
      }
      return updated
    }))
  }

  const validRows = rows.filter(r => r.product_id && parseFloat(r.qty) > 0 && parseFloat(r.unit_price) > 0)
  const subtotal  = validRows.reduce((sum, r) => sum + parseFloat(r.qty) * parseFloat(r.unit_price), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validRows.length === 0) {
      setError('Add at least one product line item.')
      return
    }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    let resolvedCustomerId: string | null = null

    // Create new customer if needed
    if (isNewCustomer && newName.trim()) {
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .insert({
          name:             newName.trim(),
          phone:            newPhone.trim() || null,
          email:            newEmail.trim() || null,
          instagram_handle: newInstagram.trim() || null,
          channel,
        })
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (custErr || !custData) {
        setError(custErr?.message ?? 'Failed to create customer.')
        setSaving(false)
        return
      }
      resolvedCustomerId = custData.id
    } else if (customerId && customerId !== 'new') {
      resolvedCustomerId = customerId
    }

    // Insert order
    const orderNumber = genOrderNumber()
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id:  resolvedCustomerId,
        order_date:   orderDate,
        status,
        channel,
        subtotal,
        total: subtotal,
        notes: notes.trim() || null,
      })
      .select('id')
      .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

    if (orderErr || !orderData) {
      setError(orderErr?.message ?? 'Failed to create order.')
      setSaving(false)
      return
    }

    // Insert line items
    const items = validRows.map(r => ({
      order_id:   orderData.id,
      product_id: r.product_id,
      quantity:   parseInt(r.qty),
      unit_price: parseFloat(r.unit_price),
    }))

    const { error: itemsErr } = await supabase.from('order_items').insert(items)

    if (itemsErr) {
      setError(itemsErr.message)
      setSaving(false)
      return
    }

    router.push(`/orders/${orderData.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Customer */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Customer</h3>
        <div>
          <label className={labelCls}>Select or create customer</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputCls}>
            <option value="">— No customer on file —</option>
            <option value="new">+ New customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.phone ? ` · ${c.phone}` : ''}
              </option>
            ))}
          </select>
        </div>
        {isNewCustomer && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className={inputCls} placeholder="e.g. Melissa Ali" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className={inputCls} placeholder="+1 868 …" />
            </div>
            <div>
              <label className={labelCls}>Instagram</label>
              <input type="text" value={newInstagram} onChange={e => setNewInstagram(e.target.value)} className={inputCls} placeholder="@handle" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputCls} placeholder="email@example.com" />
            </div>
          </div>
        )}
      </div>

      {/* Order meta */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Order Details</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} className={inputCls}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Notes (optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Pickup time, delivery address, special requests…" />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <h3 className="font-display font-semibold text-espresso mb-4">Items</h3>
        <div className="space-y-2">
          {rows.map((row, idx) => {
            const product = products.find(p => p.id === row.product_id)
            const lineTotal = parseFloat(row.qty) > 0 && parseFloat(row.unit_price) > 0
              ? parseFloat(row.qty) * parseFloat(row.unit_price)
              : null

            return (
              <div key={row.key} className="grid grid-cols-12 gap-2 items-start">
                {/* Product */}
                <div className="col-span-6">
                  {idx === 0 && <label className={labelCls}>Product</label>}
                  <select
                    value={row.product_id}
                    onChange={e => updateRow(row.key, 'product_id', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Select product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` (${p.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Qty */}
                <div className="col-span-2">
                  {idx === 0 && <label className={labelCls}>Qty</label>}
                  <input
                    type="number" min="1" step="1"
                    value={row.qty}
                    onChange={e => updateRow(row.key, 'qty', e.target.value)}
                    className={inputCls}
                  />
                </div>
                {/* Unit price */}
                <div className="col-span-2">
                  {idx === 0 && <label className={labelCls}>Price</label>}
                  <input
                    type="number" min="0" step="0.01"
                    value={row.unit_price}
                    onChange={e => updateRow(row.key, 'unit_price', e.target.value)}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
                {/* Line total */}
                <div className="col-span-1 flex items-center justify-end">
                  {idx === 0 && <div className={labelCls}>&nbsp;</div>}
                  <span className="text-sm text-muted tabular-nums">
                    {lineTotal ? formatTTD(lineTotal) : ''}
                  </span>
                </div>
                {/* Remove */}
                <div className="col-span-1 flex items-center justify-end">
                  {idx === 0 && <div className={labelCls}>&nbsp;</div>}
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1}
                    className="p-1.5 text-muted hover:text-status-red disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-terracotta hover:text-terracotta/80 transition-colors"
        >
          <Plus size={14} />
          Add item
        </button>

        {/* Total */}
        {validRows.length > 0 && (
          <div className="mt-4 pt-3 border-t border-espresso/10 flex items-center justify-between">
            <span className="text-sm text-muted">{validRows.length} item{validRows.length !== 1 ? 's' : ''}</span>
            <div className="text-right">
              <p className="text-xs text-muted">Total</p>
              <p className="font-display text-xl font-semibold text-espresso">{formatTTD(subtotal)}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving || validRows.length === 0}>
          {saving ? 'Creating…' : 'Create Order'}
        </Button>
      </div>
    </form>
  )
}
