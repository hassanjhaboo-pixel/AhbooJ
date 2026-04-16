import {
  LayoutDashboard,
  BookOpen,
  Package,
  FlaskConical,
  Tag,
  ShoppingCart,
  Users,
  Building2,
  BarChart2,
  Megaphone,
  Bot,
  Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Recipes',    href: '/recipes',    icon: BookOpen },
  { label: 'Inventory',  href: '/inventory',  icon: Package },
  { label: 'Production', href: '/production', icon: FlaskConical },
  { label: 'Products',   href: '/products',   icon: Tag },
  { label: 'Orders',     href: '/orders',     icon: ShoppingCart },
  { label: 'CRM',        href: '/crm',        icon: Users },
  { label: 'Partners',   href: '/partners',   icon: Building2 },
  { label: 'Finance',     href: '/finance',     icon: BarChart2 },
  { label: 'Marketing',   href: '/marketing',   icon: Megaphone },
  { label: 'Agents',      href: '/agents',      icon: Bot },
  { label: 'Categories',  href: '/categories',  icon: Layers },
]
