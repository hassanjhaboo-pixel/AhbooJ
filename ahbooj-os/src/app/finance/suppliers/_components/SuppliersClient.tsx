'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AddSupplierModal } from './AddSupplierModal'
import { AddPaymentModal } from './AddPaymentModal'

type Supplier = {
  id: string
  name: string
  category: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  payment_terms: string | null
  is_active: boolean
}

type Payment = {
  id: string
  supplier_id: string | null
  amount: number
  description: string | null
  due_date: string | null
  paid_date: string | null
  status: string
  suppliers: { name: string }[] | null
}

export function SuppliersClient({ suppliers, payments }: { suppliers: Supplier[]; payments: Payment[] }) {
  const router = useRouter()
  const [addSupplierOpen, setAddSupplierOpen] = useState(false)
  const [addPaymentOpen,  setAddPaymentOpen]  = useState(false)
  const [markingPaid,     setMarkingPaid]     = useState<string | null>(null)
  const [tab,             setTab]             = useState<'suppliers' | 'payments'>('suppliers')

  const outstanding = payments.filter(p => p.status !== 'paid')
  const totalOutstanding = outstanding.reduce((sum, p) => sum + p.amount, 0)

  async function markPaid(paymentId: string) {
    setMarkingPaid(paymentId)
    const supabase = createClient()
    await supabase.from('supplier_payments').update({
      status:    'paid',
      paid_date: new Date().toISOString().split('T')[0],
    }).eq('id', paymentId)
    router.refresh()
    setMarkingPaid(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Suppliers</h2>
          <p className="text-sm text-muted mt-0.5">Vendor accounts and payment tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setAddPaymentOpen(true)}><Plus size={16} />Log Payment</Button>
          <Button onClick={() => setAddSupplierOpen(true)}><Plus size={16} />Add Supplier</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{suppliers.filter(s => s.is_active).length}</p>
          <p className="text-xs text-muted mt-0.5">Active Suppliers</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          outstanding.length > 0 ? 'bg-status-amber/10 border-status-amber/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-2xl font-semibold', outstanding.length > 0 ? 'text-amber-700' : 'text-espresso')}>
            {outstanding.length}
          </p>
          <p className="text-xs text-muted mt-0.5">Outstanding Payments</p>
        </div>
        <div className={cn(
          'rounded-card shadow-card border p-4 text-center',
          totalOutstanding > 0 ? 'bg-terracotta/10 border-terracotta/30' : 'bg-cream border-cream/60'
        )}>
          <p className={cn('font-display text-xl font-semibold', totalOutstanding > 0 ? 'text-terracotta' : 'text-espresso')}>
            {totalOutstanding > 0 ? formatTTD(totalOutstanding) : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">Amount Owed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['suppliers', 'payments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
              tab === t ? 'bg-espresso text-cream' : 'text-muted hover:text-espresso'
            )}>
            {t}
            {t === 'payments' && outstanding.length > 0 && (
              <span className="ml-1.5 bg-status-amber text-espresso text-xs rounded-full px-1.5 py-0.5 font-semibold">
                {outstanding.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        suppliers.length === 0 ? (
          <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
            <p className="text-muted text-sm mb-4">No suppliers yet.</p>
            <Button onClick={() => setAddSupplierOpen(true)}><Plus size={16} />Add First Supplier</Button>
          </div>
        ) : (
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Supplier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {suppliers.map(s => (
                  <tr key={s.id} className={cn('hover:bg-espresso/5 transition-colors', !s.is_active && 'opacity-50')}>
                    <td className="px-5 py-3 font-medium text-espresso">
                      {s.name}
                      {!s.is_active && <span className="ml-2 text-xs text-muted font-normal">(inactive)</span>}
                    </td>
                    <td className="px-4 py-3"><Badge variant="muted">{s.category ?? '—'}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {s.contact_name && <p className="font-medium text-espresso">{s.contact_name}</p>}
                      {s.phone && <p>{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{s.payment_terms ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'payments' && (
        payments.length === 0 ? (
          <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
            <p className="text-muted text-sm mb-4">No payments recorded.</p>
            <Button onClick={() => setAddPaymentOpen(true)}><Plus size={16} />Log First Payment</Button>
          </div>
        ) : (
          <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Supplier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Due</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {payments.map(p => {
                  const overdue = p.status !== 'paid' && p.due_date && new Date(p.due_date) < new Date()
                  return (
                    <tr key={p.id} className={cn('hover:bg-espresso/5 transition-colors', p.status === 'paid' && 'opacity-60')}>
                      <td className="px-5 py-3 font-medium text-espresso">
                        {p.suppliers?.[0]?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{p.description ?? '—'}</td>
                      <td className={cn('px-4 py-3 text-xs tabular-nums', overdue ? 'text-status-red font-medium' : 'text-muted')}>
                        {p.due_date ? formatDate(p.due_date, 'MMM d') : '—'}
                        {overdue && ' ⚠'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'paid' ? 'green' : 'amber'}>
                          {p.status === 'paid' ? 'Paid' : 'Outstanding'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                        {formatTTD(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {p.status !== 'paid' && (
                          <button
                            onClick={() => markPaid(p.id)}
                            disabled={markingPaid === p.id}
                            className="text-terracotta hover:underline disabled:opacity-50"
                          >
                            {markingPaid === p.id ? '…' : 'Mark Paid'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {addSupplierOpen && <AddSupplierModal onClose={() => setAddSupplierOpen(false)} />}
      {addPaymentOpen  && <AddPaymentModal suppliers={suppliers} onClose={() => setAddPaymentOpen(false)} />}
    </>
  )
}
