'use client'

import { useEffect, useRef } from 'react'

export function useDraft<T extends object>(key: string, state: T, setState: (v: T) => void) {
  const isLoaded = useRef(false)
  const storageKey = `draft_${key}`

  // Load on mount
  useEffect(() => {
    if (isLoaded.current) return
    isLoaded.current = true
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setState(JSON.parse(raw) as T)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save on every state change (after initial load)
  useEffect(() => {
    if (!isLoaded.current) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {}
  }, [state, storageKey])

  function clearDraft() {
    try { localStorage.removeItem(storageKey) } catch {}
  }

  return { clearDraft }
}
