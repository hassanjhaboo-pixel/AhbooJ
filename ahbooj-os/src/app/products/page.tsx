import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { marginStatus, marginStatusVariant } from '@/lib/pricing'
import { formatTTD, formatPercent, formatRelative } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  sku: string | null
  category: string | null
  tier: string | null
  recipe_id: string | null
  direct_price: number | null
  cafe_price: number | null
  cost_per_unit: number | null
  direct_margin: number | null
  cafe_margin: number | null
  is_active: boolean
  channel: string
  updated_at?: string | null
  recipes: { name: string }[] | null
}

const CHANNEL_LABEL: Record<string, string> = {
  both:   'Direct + Café',
  direct: 'Direct',
  cafe:   'Café',
}
const CHANNEL_VARIANT: Record<string, 'green' | 'terracotta' | 'gold'> = {
  both:   'green',
  direct: 'terracotta',
  cafe:   'gold',
}

export default async function ProductsPage() {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('products')
    .select('id, name, sku, category, tier, recipe_id, direct_price, cafe_price, cost_per_unit, direct_margin, cafe_margin, is_active, channel, updated_at, recipes(name)')
    .order('name') as unknown as { data: Product[] | null; error: { message: string } | null }

  if (error?.message?.toLowerCase().includes('updated_at')) {
    const fb = await supabase
      .from('products')
      .select('id, name, sku, category, tier, recipe_id, direct_price, cafe_price, cost_per_unit, direct_margin, cafe_margin, is_active, channel, recipes(name)')
      .order('name') as unknown as { data: Product[] | null; error: { message: string } | null }
    data = fb.data?.map(p => ({ ...p, updated_at: null })) ?? null
    error = fb.error
  }

  const products = data ?? []
  const active        = products.filter(p => p.is_active).length
  const directChannel = products.filter(p => p.channel === 'direct' || p.channel === 'both').length
  const cafeChannel   = products.filter(p => p.channel === 'cafe'   || p.channel === 'both').length

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Products</h2>
          <p className="text-sm text-muted mt-0.5">
            {products.length} SKU{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/products/new">
          <Button><Plus size={16} />New Product</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load products. Ensure the database schema has been applied.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{active}</p>
          <p className="text-xs text-muted mt-0.5">Active SKUs</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{directChannel}</p>
          <p className="text-xs text-muted mt-0.5">Direct Channel</p>
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">{cafeChannel}</p>
          <p className="text-xs text-muted mt-0.5">Café Channel</p>
        </div>
      </div>

      {products.length === 0 && !error ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <Package size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No products yet</h3>
          <p className="text-muted mb-5 text-sm">Create your first SKU to manage retail pricing and margins.</p>
          <Link href="/products/new">
            <Button><Plus size={16} />Add First Product</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-espresso/5">
                  <th className="text-left px-5 py-3 font-medium text-muted text-xs uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Channel</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Direct ↑</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">D. Margin</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Café ↑</th>
                  <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">C. Margin</th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {products.map(p => {
                  const dStatus = p.direct_margin !== null ? marginStatus(p.direct_margin, 'direct') : null
                  const cStatus = p.cafe_margin   !== null ? marginStatus(p.cafe_margin,   'cafe')   : null
                  return (
                    <tr key={p.id} className={cn('hover:bg-espresso/5 transition-colors', !p.is_active && 'opacity-50')}>
                      <td className="px-5 py-3">
                        <Link href={`/products/${p.id}`} className="font-medium text-espresso hover:text-terracotta transition-colors">
                          {p.name}
                        </Link>
                        {p.recipes?.[0]?.name && (
                          <p className="text-xs text-muted mt-0.5">{p.recipes[0].name}</p>
                        )}
                        {p.updated_at && (
                          <p className="text-[10px] text-muted/70 mt-0.5">Updated {formatRelative(p.updated_at)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs font-mono">
                        {p.sku ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={CHANNEL_VARIANT[p.channel] ?? 'muted'}>
                          {CHANNEL_LABEL[p.channel] ?? p.channel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted text-xs">
                        {p.cost_per_unit ? formatTTD(p.cost_per_unit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                        {p.direct_price ? formatTTD(p.direct_price) : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dStatus && p.direct_margin !== null
                          ? <Badge variant={marginStatusVariant(dStatus)}>{formatPercent(p.direct_margin, 0)}</Badge>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-espresso">
                        {p.cafe_price ? formatTTD(p.cafe_price) : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cStatus && p.cafe_margin !== null
                          ? <Badge variant={marginStatusVariant(cStatus)}>{formatPercent(p.cafe_margin, 0)}</Badge>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.is_active ? 'green' : 'muted'}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
