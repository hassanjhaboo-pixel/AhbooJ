import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RecipeEditForm } from './_components/RecipeEditForm'

type RecipeRow = {
  id: string
  name: string
  category: string | null
  base_yield_units: number
  yield_unit_label: string
  instructions: string | null
  notes: string | null
  recipe_ingredients: Array<{
    id: string
    ingredient_id: string
    quantity: number
    unit: string
    notes: string | null
  }>
}

type IngredientRow = {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  category: string | null
}

export default async function RecipeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [recipeRes, ingredientsRes] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, name, category, base_yield_units, yield_unit_label, instructions, notes, recipe_ingredients(id, ingredient_id, quantity, unit, notes)')
      .eq('id', id)
      .single() as unknown as Promise<{ data: RecipeRow | null }>,
    supabase
      .from('ingredients')
      .select('id, name, unit, cost_per_unit, category')
      .order('name') as unknown as Promise<{ data: IngredientRow[] | null }>,
  ])

  if (!recipeRes.data) notFound()

  const recipe = recipeRes.data
  const allIngredients = ingredientsRes.data ?? []

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link
          href={`/recipes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors"
        >
          <ChevronLeft size={15} />
          {recipe.name}
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">Edit Recipe</h2>
        <p className="text-sm text-muted mt-0.5">Update ingredients, yield, and instructions.</p>
      </div>
      <RecipeEditForm
        recipe={recipe}
        existingIngredients={recipe.recipe_ingredients}
        allIngredients={allIngredients}
      />
    </PageWrapper>
  )
}
