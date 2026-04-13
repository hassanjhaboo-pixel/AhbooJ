'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTTD } from '@/lib/formatting'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Partner {
  id: string
  name: string
  payment_terms: string
}

interface Product {
  id: string
  name: string
  sku: string | null
  cafe_price: number | null
  direct_price: number | null
}

interface LineRow {
  key: number
  productId: string
  qty: string
  unitPrice: string
}

const inputCls = 'w-full rounded-lg border border-espresso/20 bg-cream px-3 py-2 text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40'
const labelCls = 'block text-xs font-medium text-muted mb-1.5'

function dueDateFromTerms(orderDate: string, terms: string): string {
  const d = new Date(orderDate)
  if (terms === 'COD' || terms === 'Prepaid') return orderDate
  const match = terms.match(/Net\s+(\d+)/)
  if (match) d.setDate(d.getDate() + parseInt(match[1]))
  return d.toISOString().split('T')[0]
}

function genInvoiceNumber(): string {
  const now = new Date()
  const ymd = now.toISOString().replace(/-/g, '').split('T')[0]
  const rand = Math.floor(Math.random() * 900 + 100)
  return `INV-${ymd}-${rand}`
}

let rowKey = 0

export function PartnerOrderForm({
  partners,
  products,
  defaultPartnerId,
}: {
  partners: Partner[]
  products: Product[]
  defaultPartnerId: string
}) {
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]

  const defaultPartner = partners.find(p => p.id === defaultPartnerId) ?? partners[0]

  const [partnerId,    setPartnerId]    = useState(defaultPartner?.id ?? '')
  const [orderDate,    setOrderDate]    = useState(today)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes,        setNotes]        = useState('')
  const [rows,         setRows]         = useState<LineRow[]>([{ key: rowKey++, productId: '', qty: '', unitPrice: '' }])
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const currentPartner = partners.find(p => p.id === partnerId)
  const dueDate = currentPartner ? dueDateFromTerms(orderDate, currentPartner.payment_terms) : orderDate

  function addRow() {
    setRows(r => [...r, { key: rowKey++, productId: '', qty: '', unitPrice: '' }])
  }

  function removeRow(key: number) {
    setRows(r => r.filter(row => row.key !== key))
  }

  const updateRow = useCallback((key: number, field: keyof Omit<LineRow, 'key'>, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.key !== key) return row
      const updated = { ...row, [field]: value }
      if (field === 'productId' && value) {
        const prod = products.find(p => p.id === value)
        if (prod) {
          updated.unitPrice = String(prod.cafe_price ?? prod.direct_price ?? '')
        }
      }
      return updated
    }))
  }, [products])

  const validRows = rows.filter(r => r.productId && r.qty && parseFloat(r.qty) > 0 && r.unitPrice && parseFloat(r.unitPrice) > 0)
  const subtotal = validRows.reduce((sum, r) => sum + parseFloat(r.qty) * parseFloat(r.unitPrice), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!partnerId || validRows.length === 0) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const invoiceNumber = genInvoiceNumber()

    const { data: orderResult, error: orderErr } = await supabase
      .from('partner_orders')
      .insert({
        invoice_number: invoiceNumber,
        partner_id:     partnerId,
        order_date:     orderDate,
        delivery_date:  deliveryDate || null,
        due_date:       dueDate,
        status:         'pending',
        subtotal:       subtotal,
        total:          subtotal,
        notes:          notes.trim() || null,
      })
      .select('id')
      .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

    if (orderErr || !orderResult) {
      setError(orderErr?.message ?? 'Failed to create order')
      setSaving(false)
      return
    }

    const items = validRows.map(r => ({
      partner_order_id: orderResult.id,
      product_id:       r.productId,
      quantity:         parseInt(r.qty),
      unit_price:       parseFloat(r.unitPrice),
    }))

    const { error: itemsErr } = await supabase.from('partner_order_items').insert(items)

    if (itemsErr) {
      setError(itemsErr.message)
      setSaving(false)
      return
    }

    router.push(`/partners/${partnerId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {/* Partner + dates */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5 space-y-4">
        <h3 className="font-display font-semibold text-espresso">Order Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Partner *</label>
            <select
              required
              value={partnerId}
              onChange={e => setPartnerId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select partner…</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Order Date</label>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Delivery Date</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        {currentPartner && (
          <p className="text-xs text-muted">
            Payment terms: <span className="font-medium text-espresso">{currentPartner.payment_terms}</span>
            {' — '}
            Due: <span className="font-medium text-espresso">{dueDate}</span>
          </p>
        )}
      </div>

      {/* Line items */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <h3 className="font-display font-semibold text-espresso mb-4">Line Items</h3>
        <div className="space-y-3">
          {rows.map((row, i) => {
            const lineTotal = row.qty && row.unitPrice
              ? parseFloat(row.qty) * parseFloat(row.unitPrice)
              : null
            return (
              <div key={row.key} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-6">
                  {i === 0 && <label className={labelCls}>Product</label>}
                  <select
                    value={row.productId}
                    onChange={e => updateRow(row.key, 'productId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` (${p.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className={labelCls}>Qty</label>}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={row.qty}
                    onChange={e => updateRow(row.key, 'qty', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className={labelCls}>Unit Price</label>}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={row.unitPrice}
                    onChange={e => updateRow(row.key, 'unitPrice', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1 flex items-end pb-0.5">
                  {i === 0 && <div className={labelCls}>&nbsp;</div>}
                  <span className="text-xs text-muted tabular-nums whitespace-nowrap pt-2">
                    {lineTotal != null && !isNaN(lineTotal) ? formatTTD(lineTotal) : ''}
                  </span>
                </div>
                <div className="col-span-1 flex items-end justify-end pb-0.5">
                  {i === 0 && <div className={labelCls}>&nbsp;</div>}
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="p-1.5 text-muted hover:text-status-red transition-colors rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-xs text-terracotta hover:underline"
        >
          <Plus size={13} />
          Add line
        </button>

        {validRows.length > 0 && (
          <div className="mt-4 pt-4 border-t border-espresso/10 flex justify-end">
            <div className="text-right">
              <p className="text-xs text-muted mb-0.5">Subtotal</p>
              <p className="font-display text-xl font-semibold text-espresso">{formatTTD(subtotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={3}
          className={cn(inputCls, 'resize-none')}
          placeholder="Delivery instructions, special requests…"
        />
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-3 text-sm text-status-red">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button
          type="submit"
          disabled={saving || !partnerId || validRows.length === 0}
        >
          {saving ? 'Creating…' : 'Create Order'}
        </Button>
      </div>
    </form>
  )
}
