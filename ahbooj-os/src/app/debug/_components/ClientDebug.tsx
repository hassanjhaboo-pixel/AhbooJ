'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ClientDebug() {
  const [result, setResult] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  async function runTest() {
    setRunning(true)
    setResult(null)
    try {
      const supabase = createClient()
      const { data, error, status, statusText } = await supabase
        .from('ingredients')
        .select('id, name')
        .limit(1)

      const out = {
        success:    !error,
        status,
        statusText,
        error:      error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
        rowCount:   data?.length ?? 0,
        firstRow:   data?.[0] ?? null,
        url:        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING',
        keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyPrefix:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) ?? 'MISSING',
      }
      setResult(JSON.stringify(out, null, 2))
    } catch (e: unknown) {
      setResult(JSON.stringify({ thrown: e instanceof Error ? e.message : String(e) }, null, 2))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mt-6 border border-blue-300 rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-blue-900">Browser Client Test (createBrowserClient)</h2>
        <button
          onClick={runTest}
          disabled={running}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run Client Test'}
        </button>
      </div>
      {result && (
        <pre className="text-xs bg-white border border-blue-200 rounded p-3 overflow-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
      {!result && (
        <p className="text-sm text-blue-700">Click the button — runs in the browser using the public anon key.</p>
      )}
    </div>
  )
}
