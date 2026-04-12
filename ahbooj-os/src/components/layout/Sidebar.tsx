'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, toggle, closeMobile } = useSidebar()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-espresso/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'relative flex flex-col h-screen bg-espresso text-cream',
          'border-r border-white/10 sidebar-transition overflow-hidden flex-shrink-0 z-50',
          // Desktop width
          isCollapsed ? 'w-16' : 'w-60',
          // Mobile: fixed overlay when open, hidden when closed
          'md:relative md:translate-x-0',
          isMobileOpen
            ? 'fixed translate-x-0'
            : 'fixed -translate-x-full md:relative md:translate-x-0'
        )}
      >
        {/* Logo / brand */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <span className="font-display text-lg font-semibold text-cream tracking-wide select-none">
              AhbooJ
            </span>
          )}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-muted hover:text-cream hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed
              ? <ChevronRight size={16} />
              : <ChevronLeft size={16} />
            }
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobileOpen && closeMobile()}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'text-sm font-medium transition-all duration-150',
                  isCollapsed && 'justify-center',
                  active
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'text-cream/70 hover:text-cream hover:bg-white/10'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom user area */}
        <div className={cn(
          'border-t border-white/10 p-3 flex-shrink-0',
          isCollapsed && 'flex justify-center'
        )}>
          <div className={cn(
            'flex items-center gap-2',
            isCollapsed && 'justify-center'
          )}>
            <div className="w-7 h-7 rounded-full bg-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-gold">H</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-cream truncate">Hassan</p>
                <p className="text-xs text-muted truncate">Owner</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
