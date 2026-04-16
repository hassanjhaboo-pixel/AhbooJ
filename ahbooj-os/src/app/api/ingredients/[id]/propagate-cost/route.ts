import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcBatchCost, calcCostPerUnit } from '@/lib/pricing'

/**
 * POST /api/ingredients/[id]/propagate-cost
 *
 * When an ingredient's cost_per_unit changes, cascade the update to:
 * 1. All recipes that use this ingredient → recalculate each recipe's cost
 * 2. All products linked to those recipes → recalculate cost_per_unit, direct_margin, cafe_margin
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ingredientId } = await params
  const supabase = createAdminClient()

  // 1. Fetch the updated ingredient cost
  const { data: ingredient, error: ingErr } = await supabase
    .from('ingredients')
    .select('id, name, cost_per_unit')
    .eq('id', ingredientId)
    .single()

  if (ingErr || !ingredient) {
    return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
  }

  // 2. Find all recipes that include this ingredient
  const { data: affectedRecipeLinks } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id')
    .eq('ingredient_id', ingredientId) as unknown as { data: Array<{ recipe_id: string }> | null }

  if (!affectedRecipeLinks || affectedRecipeLinks.length === 0) {
    return NextResponse.json({ updated: 0, message: 'No recipes use this ingredient' })
  }

  const recipeIds = [...new Set(affectedRecipeLinks.map(r => r.recipe_id as string))]

  // 3. For each affected recipe, fetch all ingredients and recompute cost
  type RecipeIngRow = {
    recipe_id: string
    quantity: number
    ingredients: { cost_per_unit: number } | null
  }
  type RecipeMeta = {
    id: string
    base_yield_units: number
  }

  const [recipeIngsRes, recipesMetaRes] = await Promise.all([
    supabase
      .from('recipe_ingredients')
      .select('recipe_id, quantity, ingredients(cost_per_unit)')
      .in('recipe_id', recipeIds) as unknown as Promise<{ data: RecipeIngRow[] | null }>,
    supabase
      .from('recipes')
      .select('id, base_yield_units')
      .in('id', recipeIds) as unknown as Promise<{ data: RecipeMeta[] | null }>,
  ])

  const recipeIngs = recipeIngsRes.data ?? []
  const recipesMeta = recipesMetaRes.data ?? []

  // Group recipe_ingredients by recipe_id
  const ingsByRecipe = new Map<string, Array<{ quantity: number; cost_per_unit: number }>>()
  for (const ri of recipeIngs) {
    const list = ingsByRecipe.get(ri.recipe_id) ?? []
    list.push({
      quantity:      ri.quantity,
      cost_per_unit: ri.ingredients?.cost_per_unit ?? 0,
    })
    ingsByRecipe.set(ri.recipe_id, list)
  }

  // Compute new cost_per_unit per recipe
  const recipeCosts = new Map<string, number>()
  for (const recipe of recipesMeta) {
    const ings = ingsByRecipe.get(recipe.id) ?? []
    const batchCost = calcBatchCost(ings)
    recipeCosts.set(recipe.id, calcCostPerUnit(batchCost, recipe.base_yield_units))
  }

  // 4. Find products linked to affected recipes
  type ProductRow = {
    id: string
    recipe_id: string | null
    direct_price: number | null
    cafe_price: number | null
  }

  const { data: affectedProducts } = await supabase
    .from('products')
    .select('id, recipe_id, direct_price, cafe_price')
    .in('recipe_id', recipeIds) as unknown as { data: ProductRow[] | null }

  // 5. Update each product: cost_per_unit, direct_margin, cafe_margin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productUpdates: Promise<any>[] = []
  let updatedProductCount = 0

  for (const product of affectedProducts ?? []) {
    if (!product.recipe_id) continue
    const newCost = recipeCosts.get(product.recipe_id)
    if (newCost === undefined) continue

    const directMargin = product.direct_price && product.direct_price > 0
      ? ((product.direct_price - newCost) / product.direct_price) * 100
      : null
    const cafeMargin = product.cafe_price && product.cafe_price > 0
      ? ((product.cafe_price - newCost) / product.cafe_price) * 100
      : null

    productUpdates.push(
      Promise.resolve(
        supabase
          .from('products')
          .update({
            cost_per_unit:  newCost,
            direct_margin:  directMargin !== null ? Math.round(directMargin * 100) / 100 : null,
            cafe_margin:    cafeMargin   !== null ? Math.round(cafeMargin   * 100) / 100 : null,
          })
          .eq('id', product.id)
      )
    )
    updatedProductCount++
  }

  await Promise.all(productUpdates)

  return NextResponse.json({
    ingredientId,
    ingredientName: ingredient.name,
    newCostPerUnit:  ingredient.cost_per_unit,
    recipesAffected: recipeIds.length,
    productsUpdated: updatedProductCount,
  })
}
