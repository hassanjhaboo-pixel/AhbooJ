'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type SidebarState = 'expanded' | 'collapsed' | 'mobile-open'

interface SidebarContextValue {
  state: SidebarState
  toggle: () => void
  openMobile: () => void
  closeMobile: () => void
  isCollapsed: boolean
  isMobileOpen: boolean
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidebarState>('expanded')

  useEffect(() => {
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280
    const isMobile = window.innerWidth < 768
    if (isMobile || isTablet) {
      setState('collapsed')
    } else {
      const stored = localStorage.getItem('sidebar-state') as SidebarState | null
      setState(stored ?? 'expanded')
    }
  }, [])

  const toggle = () => {
    setState(prev => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded'
      try { localStorage.setItem('sidebar-state', next) } catch {}
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{
      state,
      toggle,
      openMobile: () => setState('mobile-open'),
      closeMobile: () => setState('collapsed'),
      isCollapsed: state === 'collapsed',
      isMobileOpen: state === 'mobile-open',
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
