import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function PageWrapper({ children, className, fullWidth = false }: PageWrapperProps) {
  return (
    <main className={cn(
      'flex-1 overflow-y-auto p-6',
      !fullWidth && 'max-w-7xl mx-auto w-full',
      className
    )}>
      {children}
    </main>
  )
}
