import { createBrowserClient } from '@supabase/ssr'

// Type parameter omitted intentionally — our hand-written Database type doesn't
// match Supabase's exact generic shape. All query results are cast explicitly.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
