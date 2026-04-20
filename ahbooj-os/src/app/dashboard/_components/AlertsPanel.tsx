'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Info, XCircle, X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string | null
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

function entityHref(type: string | null, id: string | null): string | null {
  if (!id) return null
  switch (type) {
    case 'order':       return `/orders/${id}`
    case 'partner_order': return `/partners`
    case 'customer':    return `/crm/${id}`
    case 'ingredient':  return `/inventory`
    default:            return null
  }
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <XCircle size={15} className="text-status-red flex-shrink-0" />
  if (severity === 'warning')  return <AlertTriangle size={15} className="text-status-amber flex-shrink-0" />
  return <Info size={15} className="text-terracotta flex-shrink-0" />
}

export function AlertsPanel({ alerts: initial }: { alerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initial)
  const router = useRouter()

  const unread = alerts.filter(a => true) // all passed in are unread

  async function dismiss(alertId: string) {
    const supabase = createClient()
    await supabase.from('dashboard_alerts').update({ is_read: true }).eq('id', alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
    router.refresh()
  }

  async function dismissAll() {
    const supabase = createClient()
    const ids = alerts.map(a => a.id)
    await supabase.from('dashboard_alerts').update({ is_read: true }).in('id', ids)
    setAlerts([])
    router.refresh()
  }

  if (alerts.length === 0) return null

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden mb-5">
      <div className="px-5 py-3.5 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-muted" />
          <h3 className="font-display font-semibold text-espresso text-sm">Alerts</h3>
          <span className="bg-status-red text-white text-xs font-medium rounded-full px-1.5 py-0.5 leading-none">
            {unread.length}
          </span>
        </div>
        <button
          onClick={dismissAll}
          className="text-xs text-muted hover:text-espresso transition-colors"
        >
          Dismiss all
        </button>
      </div>

      <div className="divide-y divide-espresso/5">
        {alerts.map(alert => {
          const href = entityHref(alert.entity_type, alert.entity_id ? String(alert.entity_id) : null)
          return (
            <div
              key={alert.id}
              className={cn(
                'px-5 py-3 flex items-start gap-3 group',
                alert.severity === 'critical' && 'bg-status-red/5',
                alert.severity === 'warning'  && 'bg-status-amber/5',
              )}
            >
              <SeverityIcon severity={alert.severity} />
              <div className="flex-1 min-w-0">
                {href ? (
                  <Link href={href} className="text-sm font-medium text-espresso hover:text-terracotta transition-colors leading-tight block">
                    {alert.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-espresso leading-tight">{alert.title}</p>
                )}
                {alert.message && (
                  <p className="text-xs text-muted mt-0.5">{alert.message}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(alert.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted hover:text-espresso"
                title="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
