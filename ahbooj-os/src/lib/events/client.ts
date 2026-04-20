import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Returns a Supabase client suitable for event handlers (server-side API routes).
 * Prefers service-role client to bypass RLS; falls back to anon key since all
 * tables have permissive anon policies. This means events work even if
 * SUPABASE_SERVICE_ROLE_KEY is not yet configured in Vercel.
 */
export function createEventClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey && serviceKey !== 'placeholder') {
    return createAdminClient()
  }
  // Anon key fallback — works because schema has permissive RLS for anon
  console.warn('[events] SUPABASE_SERVICE_ROLE_KEY not configured — using anon key')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
