import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcBatchCost, calcCostPerUnit, marginStatus, marginStatusVariant } from '@/lib/pricing'
import { formatTTD, formatPercent } from '@/lib/formatting'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { ProductEditForm } from './_components/ProductEditForm'

type ProductDetail = {
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
  notes: string | null
  recipes: { id: string; name: string }[] | null
}

type RecipeRow = {
  id: string
  name: string
  base_yield_units: number
  recipe_ingredients: Array<{
    quantity: number
    ingredients: { cost_per_unit: number } | null
  }>
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: productData } = await supabase
    .from('products')
    .select('id, name, sku, category, tier, recipe_id, direct_price, cafe_price, cost_per_unit, direct_margin, cafe_margin, is_active, channel, notes, recipes(id, name)')
    .eq('id', id)
    .maybeSingle() as unknown as { data: ProductDetail | null }

  if (!productData) notFound()

  const { data: recipeData } = await supabase
    .from('recipes')
    .select('id, name, base_yield_units, recipe_ingredients(quantity, ingredients(cost_per_unit))')
    .eq('is_active', true)
    .order('name') as unknown as { data: RecipeRow[] | null }

  const recipes = (recipeData ?? []).map(r => {
    const ings = r.recipe_ingredients.map(ri => ({
      quantity:      ri.quantity,
      cost_per_unit: ri.ingredients?.cost_per_unit ?? 0,
    }))
    return {
      id:          r.id,
      name:        r.name,
      costPerUnit: calcCostPerUnit(calcBatchCost(ings), r.base_yield_units),
    }
  })

  const dStatus = productData.direct_margin !== null ? marginStatus(productData.direct_margin, 'direct') : null
  const cStatus = productData.cafe_margin   !== null ? marginStatus(productData.cafe_margin,   'cafe')   : null

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          All Products
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-display text-2xl font-semibold text-espresso">{productData.name}</h2>
            <Badge variant={productData.is_active ? 'green' : 'muted'}>
              {productData.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted flex-wrap">
            {productData.sku && <span className="font-mono">{productData.sku}</span>}
            {productData.sku && productData.recipes?.[0] && <span>·</span>}
            {productData.recipes?.[0] && (
              <Link
                href={`/recipes/${productData.recipe_id}`}
                className="hover:text-terracotta transition-colors"
              >
                {productData.recipes[0].name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pricing summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Direct Sale</p>
          <p className="font-display text-2xl font-semibold text-espresso">
            {productData.direct_price
              ? formatTTD(productData.direct_price)
              : <span className="text-muted text-base font-sans font-normal">Not set</span>}
          </p>
          {dStatus && productData.direct_margin !== null && (
            <div className="mt-1.5">
              <Badge variant={marginStatusVariant(dStatus)}>
                {formatPercent(productData.direct_margin, 0)} margin
              </Badge>
            </div>
          )}
        </div>
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Café / Wholesale</p>
          <p className="font-display text-2xl font-semibold text-espresso">
            {productData.cafe_price
              ? formatTTD(productData.cafe_price)
              : <span className="text-muted text-base font-sans font-normal">Not set</span>}
          </p>
          {cStatus && productData.cafe_margin !== null && (
            <div className="mt-1.5">
              <Badge variant={marginStatusVariant(cStatus)}>
                {formatPercent(productData.cafe_margin, 0)} margin
              </Badge>
            </div>
          )}
        </div>
      </div>

      <ProductEditForm product={productData} recipes={recipes} />
    </PageWrapper>
  )
}
