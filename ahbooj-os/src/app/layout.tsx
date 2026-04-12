import type { Metadata } from 'next'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'AhbooJ OS',
  description: 'AhbooJ Desserts — Business Operating System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <SidebarProvider>
          <div className="flex h-full overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <Header />
              {children}
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
