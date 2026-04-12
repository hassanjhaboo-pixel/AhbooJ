'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, MessageCircle, Mail } from 'lucide-react'
import { formatTTD, formatDate } from '@/lib/formatting'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AddCustomerModal } from './AddCustomerModal'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  instagram_handle: string | null
  channel: string
  on_whatsapp_list: boolean
  on_email_list: boolean
  total_orders: number
  total_spend: number
  last_order_date: string | null
  is_active: boolean
}

interface Stats {
  total: number
  whatsapp: number
  email: number
  active: number
}

const CHANNEL_TABS = [
  { value: 'all',       label: 'All' },
  { value: 'whatsapp_list', label: 'WhatsApp List' },
  { value: 'email_list',    label: 'Email List' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'market',    label: 'Market' },
]

const CHANNEL_VARIANT: Record<string, 'green' | 'terracotta' | 'gold' | 'muted'> = {
  direct:    'terracotta',
  instagram: 'gold',
  whatsapp:  'green',
  market:    'muted',
  referral:  'muted',
}

export function CRMClient({ customers, stats, error }: { customers: Customer[]; stats: Stats; error?: string }) {
  const [search,     setSearch]     = useState('')
  const [activeTab,  setActiveTab]  = useState('all')
  const [addOpen,    setAddOpen]    = useState(false)

  const filtered = customers.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
      || c.phone?.includes(search)
      || c.instagram_handle?.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      activeTab === 'all'           ? true :
      activeTab === 'whatsapp_list' ? c.on_whatsapp_list :
      activeTab === 'email_list'    ? c.on_email_list :
      c.channel === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">CRM</h2>
          <p className="text-sm text-muted mt-0.5">{stats.total} customers</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add Customer</Button>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load customers. Ensure the database schema has been applied.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{stats.active}</p>
          <p className="text-xs text-muted mt-0.5">Active Customers</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <MessageCircle size={14} className="text-status-green" />
            <p className="font-display text-2xl font-semibold text-espresso">{stats.whatsapp}</p>
          </div>
          <p className="text-xs text-muted">WhatsApp List</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <Mail size={14} className="text-terracotta" />
            <p className="font-display text-2xl font-semibold text-espresso">{stats.email}</p>
          </div>
          <p className="text-xs text-muted">Email List</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
        <div className="p-3 border-b border-espresso/10 flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, @handle…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-espresso/20 bg-warm-white text-sm text-espresso placeholder-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {CHANNEL_TABS.map(tab => {
              const count =
                tab.value === 'all'           ? customers.length :
                tab.value === 'whatsapp_list' ? stats.whatsapp :
                tab.value === 'email_list'    ? stats.email :
                customers.filter(c => c.channel === tab.value).length
              if (tab.value !== 'all' && count === 0) return null
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    activeTab === tab.value
                      ? 'bg-espresso text-cream'
                      : 'text-muted hover:text-espresso hover:bg-espresso/5'
                  )}
                >
                  {tab.label} <span className="ml-1 opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">
              {search ? 'No customers match your search' : 'No customers yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Channel</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Lists</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Orders</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Spend</th>
                  <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {filtered.map(c => (
                  <tr key={c.id} className={cn('hover:bg-espresso/5 transition-colors', !c.is_active && 'opacity-50')}>
                    <td className="px-5 py-3">
                      <Link href={`/crm/${c.id}`} className="font-medium text-espresso hover:text-terracotta transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted space-y-0.5">
                      {c.phone && <p>{c.phone}</p>}
                      {c.instagram_handle && <p className="text-gold">{c.instagram_handle}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CHANNEL_VARIANT[c.channel] ?? 'muted'}>
                        {c.channel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.on_whatsapp_list && (
                          <span title="WhatsApp list" className="text-status-green">
                            <MessageCircle size={14} />
                          </span>
                        )}
                        {c.on_email_list && (
                          <span title="Email list" className="text-terracotta">
                            <Mail size={14} />
                          </span>
                        )}
                        {!c.on_whatsapp_list && !c.on_email_list && (
                          <span className="text-muted/40 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                      {c.total_spend > 0 ? formatTTD(c.total_spend) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted tabular-nums">
                      {c.last_order_date ? formatDate(c.last_order_date, 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && <AddCustomerModal onClose={() => setAddOpen(false)} />}
    </>
  )
}
