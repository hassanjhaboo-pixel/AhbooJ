import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Type parameter omitted intentionally — our hand-written Database type doesn't
// match Supabase's exact generic shape. All query results are cast explicitly.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookie writes are ignored for read-only usage
          }
        },
      },
    }
  )
}
