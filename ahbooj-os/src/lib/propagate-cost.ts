import { SupabaseClient } from '@supabase/supabase-js'
import { calcBatchCost, calcCostPerUnit } from '@/lib/pricing'

/**
 * When an ingredient's cost_per_unit changes, recalculate cost for all recipes
 * that use it and update the linked products' margins. Called from both the
 * API route and the events library (avoids serverless self-HTTP calls).
 */
export async function propagateIngredientCost(
  supabase: SupabaseClient,
  ingredientId: string
): Promise<{ recipesAffected: number; productsUpdated: number }> {
  type RecipeIngRow = { recipe_id: string; quantity: number; ingredients: { cost_per_unit: number } | null }
  type RecipeMeta   = { id: string; base_yield_units: number }
  type ProductRow   = { id: string; recipe_id: string | null; direct_price: number | null; cafe_price: number | null }

  const { data: recipeLinks } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id')
    .eq('ingredient_id', ingredientId) as unknown as { data: Array<{ recipe_id: string }> | null }

  if (!recipeLinks?.length) return { recipesAffected: 0, productsUpdated: 0 }

  const recipeIds = [...new Set(recipeLinks.map(r => r.recipe_id))]

  const [riRes, metaRes] = await Promise.all([
    supabase.from('recipe_ingredients')
      .select('recipe_id, quantity, ingredients(cost_per_unit)')
      .in('recipe_id', recipeIds) as unknown as Promise<{ data: RecipeIngRow[] | null }>,
    supabase.from('recipes')
      .select('id, base_yield_units')
      .in('id', recipeIds) as unknown as Promise<{ data: RecipeMeta[] | null }>,
  ])

  const ingsByRecipe = new Map<string, Array<{ quantity: number; cost_per_unit: number }>>()
  for (const ri of riRes.data ?? []) {
    const list = ingsByRecipe.get(ri.recipe_id) ?? []
    list.push({ quantity: ri.quantity, cost_per_unit: ri.ingredients?.cost_per_unit ?? 0 })
    ingsByRecipe.set(ri.recipe_id, list)
  }

  const recipeCosts = new Map<string, number>()
  for (const recipe of metaRes.data ?? []) {
    const batchCost = calcBatchCost(ingsByRecipe.get(recipe.id) ?? [])
    recipeCosts.set(recipe.id, calcCostPerUnit(batchCost, recipe.base_yield_units))
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, recipe_id, direct_price, cafe_price')
    .in('recipe_id', recipeIds) as unknown as { data: ProductRow[] | null }

  let productsUpdated = 0
  await Promise.all(
    (products ?? []).map(product => {
      if (!product.recipe_id) return Promise.resolve()
      const newCost = recipeCosts.get(product.recipe_id)
      if (newCost === undefined) return Promise.resolve()

      const directMargin = product.direct_price && product.direct_price > 0
        ? Math.round(((product.direct_price - newCost) / product.direct_price) * 10000) / 100
        : null
      const cafeMargin = product.cafe_price && product.cafe_price > 0
        ? Math.round(((product.cafe_price - newCost) / product.cafe_price) * 10000) / 100
        : null

      productsUpdated++
      return Promise.resolve(
        supabase.from('products').update({ cost_per_unit: newCost, direct_margin: directMargin, cafe_margin: cafeMargin }).eq('id', product.id)
      )
    })
  )

  return { recipesAffected: recipeIds.length, productsUpdated }
}
