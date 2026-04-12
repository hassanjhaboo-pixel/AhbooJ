'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/navigation'
import { useSidebar } from '@/contexts/SidebarContext'

function getPageTitle(pathname: string): string {
  const exact = NAV_ITEMS.find(item => item.href === pathname)
  if (exact) return exact.label
  const prefix = NAV_ITEMS.find(item =>
    item.href !== '/dashboard' && pathname.startsWith(item.href + '/')
  )
  if (prefix) return prefix.label
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard'
  return 'AhbooJ OS'
}

export function Header() {
  const pathname = usePathname()
  const { openMobile } = useSidebar()
  const title = getPageTitle(pathname)

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-warm-white border-b border-cream/60 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={openMobile}
          className="md:hidden p-2 rounded-lg text-muted hover:text-espresso hover:bg-cream transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-xl font-semibold text-espresso">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <div className="w-2 h-2 rounded-full bg-status-green" />
          <span className="hidden sm:inline">Live</span>
        </div>
      </div>
    </header>
  )
}
