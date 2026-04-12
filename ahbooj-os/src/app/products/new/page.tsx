import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcBatchCost, calcCostPerUnit } from '@/lib/pricing'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProductForm } from './_components/ProductForm'

type RecipeRow = {
  id: string
  name: string
  base_yield_units: number
  recipe_ingredients: Array<{
    quantity: number
    ingredients: { cost_per_unit: number } | null
  }>
}

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('recipes')
    .select('id, name, base_yield_units, recipe_ingredients(quantity, ingredients(cost_per_unit))')
    .eq('is_active', true)
    .order('name') as unknown as { data: RecipeRow[] | null }

  const recipes = (data ?? []).map(r => {
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

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          All Products
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">New Product</h2>
        <p className="text-sm text-muted mt-0.5">Create a SKU and set your retail and café pricing.</p>
      </div>
      <ProductForm recipes={recipes} />
    </PageWrapper>
  )
}
