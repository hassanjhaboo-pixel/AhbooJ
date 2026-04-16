import Link from 'next/link'
import { FileText, AlertCircle } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { cn } from '@/lib/utils'

type Invoice = {
  id: string
  invoice_number: string | null
  total: number | null
  due_date: string | null
  status: string
  partners: { name: string }[] | null
}

export function OutstandingInvoicesCard({ invoices }: { invoices: Invoice[] }) {
  const totalOwed = invoices.reduce((s, i) => s + (i.total ?? 0), 0)

  const today = new Date().toISOString().split('T')[0]
  const overdueCount = invoices.filter(i => i.due_date && i.due_date < today && i.status !== 'paid').length

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-terracotta" />
          <h3 className="font-display font-semibold text-espresso text-sm">Outstanding Invoices</h3>
        </div>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {overdueCount} overdue
          </span>
        )}
      </div>

      <div className="px-5 py-3 border-b border-espresso/5 bg-espresso/[0.02]">
        <p className="text-xs text-muted">Total owed</p>
        <p className="font-display text-xl font-bold text-espresso">{formatTTD(totalOwed)}</p>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">No outstanding invoices.</p>
      ) : (
        <div className="divide-y divide-espresso/5">
          {invoices.slice(0, 5).map(inv => {
            const isOverdue = inv.due_date && inv.due_date < today
            return (
              <Link
                key={inv.id}
                href={`/partners/${inv.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-espresso/[0.03] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-espresso">
                    {inv.partners?.[0]?.name ?? 'Unknown'}
                  </p>
                  <p className={cn('text-xs', isOverdue ? 'text-red-500' : 'text-muted')}>
                    {inv.invoice_number ?? '—'}
                    {inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ''}
                    {isOverdue ? ' · OVERDUE' : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-espresso">{formatTTD(inv.total ?? 0)}</span>
              </Link>
            )
          })}
          {invoices.length > 5 && (
            <div className="px-5 py-3 text-center">
              <Link href="/partners" className="text-xs text-terracotta hover:underline">
                +{invoices.length - 5} more — View all
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
