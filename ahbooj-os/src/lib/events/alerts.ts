import { createAdminClient } from '@/lib/supabase/admin'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export async function createAlert(params: {
  type: string
  severity: AlertSeverity
  title: string
  message?: string
  entity_type?: string
  entity_id?: string
}) {
  const supabase = createAdminClient()
  await supabase.from('dashboard_alerts').insert({
    type: params.type,
    severity: params.severity,
    title: params.title,
    message: params.message ?? null,
    entity_type: params.entity_type ?? null,
    entity_id: params.entity_id ?? null,
    is_read: false,
  })
}

export async function dismissAlert(alertId: string) {
  const supabase = createAdminClient()
  await supabase.from('dashboard_alerts').update({ is_read: true }).eq('id', alertId)
}
