import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientDebug } from './_components/ClientDebug'

function mask(val: string | undefined, show = 20) {
  if (!val) return '❌ MISSING'
  return val.slice(0, show) + '…' + ` (${val.length} chars)`
}

async function runServerTest(label: string, fn: () => Promise<unknown>) {
  const start = Date.now()
  try {
    const result = await fn()
    return { label, ok: true, ms: Date.now() - start, result }
  } catch (e: unknown) {
    return { label, ok: false, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) }
  }
}

export default async function DebugPage() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // ── Server-side tests ───────────────────────────────────────
  const serverClient = await createClient()
  const adminClient  = createAdminClient()

  const tests = await Promise.all([
    // 1. Basic SELECT with anon client
    runServerTest('anon SELECT ingredients (limit 1)', async () => {
      const { data, error, status } = await serverClient
        .from('ingredients')
        .select('id, name')
        .limit(1)
      if (error) throw new Error(`[${status}] ${error.message} | code: ${error.code} | hint: ${error.hint}`)
      return { rowCount: data?.length, first: data?.[0] }
    }),

    // 2. Basic SELECT with admin client (bypasses RLS)
    runServerTest('admin SELECT ingredients (limit 1)', async () => {
      const { data, error, status } = await adminClient
        .from('ingredients')
        .select('id, name')
        .limit(1)
      if (error) throw new Error(`[${status}] ${error.message} | code: ${error.code} | hint: ${error.hint}`)
      return { rowCount: data?.length, first: data?.[0] }
    }),

    // 3. Anon SELECT on settings (smaller table, good canary)
    runServerTest('anon SELECT settings (limit 1)', async () => {
      const { data, error, status } = await serverClient
        .from('settings')
        .select('key, value')
        .limit(1)
      if (error) throw new Error(`[${status}] ${error.message} | code: ${error.code} | hint: ${error.hint}`)
      return { rowCount: data?.length, first: data?.[0] }
    }),

    // 4. Anon SELECT on customers
    runServerTest('anon SELECT customers (count)', async () => {
      const { count, error, status } = await serverClient
        .from('customers')
        .select('id', { count: 'exact', head: true })
      if (error) throw new Error(`[${status}] ${error.message} | code: ${error.code} | hint: ${error.hint}`)
      return { count }
    }),

    // 5. Raw fetch to Supabase REST to isolate client library issues
    runServerTest('raw fetch to Supabase REST API', async () => {
      if (!url || !anon) throw new Error('URL or anon key missing from env')
      const res = await fetch(`${url}/rest/v1/ingredients?select=id,name&limit=1`, {
        headers: {
          apikey:        anon,
          Authorization: `Bearer ${anon}`,
        },
      })
      const body = await res.json()
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`)
      return { status: res.status, body }
    }),
  ])

  const allOk = tests.every(t => t.ok)

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-1">🔍 Supabase Debug</h1>
      <p className="text-gray-500 mb-6 text-xs">Server-rendered at {new Date().toISOString()}</p>

      {/* Environment */}
      <section className="mb-6 bg-white border rounded-lg p-4">
        <h2 className="font-bold mb-3 text-gray-800">Environment Variables (server-side)</h2>
        <table className="w-full text-xs">
          <tbody>
            <tr className="border-b">
              <td className="py-1.5 pr-4 text-gray-500 w-64">NEXT_PUBLIC_SUPABASE_URL</td>
              <td className={`py-1.5 font-medium ${url ? 'text-green-700' : 'text-red-600'}`}>{url ?? '❌ MISSING'}</td>
            </tr>
            <tr className="border-b">
              <td className="py-1.5 pr-4 text-gray-500">NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
              <td className={`py-1.5 font-medium ${anon ? 'text-green-700' : 'text-red-600'}`}>{mask(anon)}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-gray-500">SUPABASE_SERVICE_ROLE_KEY</td>
              <td className={`py-1.5 font-medium ${svcKey ? 'text-green-700' : 'text-red-600'}`}>{mask(svcKey)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Summary */}
      <section className={`mb-6 border rounded-lg p-4 ${allOk ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
        <h2 className={`font-bold mb-1 ${allOk ? 'text-green-800' : 'text-red-800'}`}>
          {allOk ? '✅ All server tests passed' : '❌ One or more server tests failed'}
        </h2>
        <p className="text-xs text-gray-600">
          {tests.filter(t => t.ok).length}/{tests.length} tests passed
        </p>
      </section>

      {/* Test results */}
      <section className="mb-6 space-y-3">
        <h2 className="font-bold text-gray-800">Server-Side Test Results</h2>
        {tests.map((t, i) => (
          <div
            key={i}
            className={`border rounded-lg p-4 ${t.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-300'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">
                {t.ok ? '✅' : '❌'} {t.label}
              </span>
              <span className="text-xs text-gray-400">{t.ms}ms</span>
            </div>
            <pre className="text-xs bg-white border rounded p-2 overflow-auto whitespace-pre-wrap">
              {t.ok
                ? JSON.stringify((t as { result: unknown }).result, null, 2)
                : `ERROR: ${(t as { error: string }).error}`}
            </pre>
          </div>
        ))}
      </section>

      {/* Key diagnostics guide */}
      <section className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="font-bold text-yellow-900 mb-2">How to read this</h2>
        <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
          <li><strong>Admin passes, anon fails</strong> → GRANTs are missing. Run <code>database/grants.sql</code> in the Supabase SQL editor.</li>
          <li><strong>Both fail with "Invalid API key"</strong> → Wrong anon key in env vars.</li>
          <li><strong>Both fail with connection error</strong> → Wrong Supabase URL in env vars.</li>
          <li><strong>Anon passes, raw fetch fails</strong> → Network/CORS issue, not a code issue.</li>
          <li><strong>Raw fetch passes, anon fails</strong> → Bug in the Supabase client library initialization.</li>
          <li><strong>All pass</strong> → Database is fine; the error is elsewhere (check specific page).</li>
        </ul>
      </section>

      {/* Browser client test */}
      <ClientDebug />
    </div>
  )
}
