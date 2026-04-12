import Link from 'next/link'
import { Plus, FlaskConical, Bot, ShoppingCart } from 'lucide-react'

const actions = [
  {
    label: 'Log Sale',
    href: '/orders/new',
    icon: ShoppingCart,
    description: 'Record a direct order',
  },
  {
    label: 'New Batch',
    href: '/production',
    icon: FlaskConical,
    description: 'Log a production run',
  },
  {
    label: 'Run Agent',
    href: '/agents',
    icon: Bot,
    description: 'AI assistant',
  },
  {
    label: 'New Order',
    href: '/orders/new',
    icon: Plus,
    description: 'Any channel',
  },
]

export function QuickActions() {
  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
      <h3 className="font-display font-semibold text-espresso mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warm-white hover:bg-espresso/5 border border-transparent hover:border-espresso/10 transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
                <Icon size={18} className="text-terracotta" />
              </div>
              <span className="text-sm font-medium text-espresso">{action.label}</span>
              <span className="text-xs text-muted leading-tight">{action.description}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
