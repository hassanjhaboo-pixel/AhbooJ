import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RecipeForm } from './_components/RecipeForm'

export default async function NewRecipePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ingredients')
    .select('id, name, unit, cost_per_unit, category')
    .order('name')

  const ingredients = (data ?? []) as Array<{
    id: string; name: string; unit: string; cost_per_unit: number; category: string | null
  }>

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link href="/recipes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-espresso transition-colors">
          <ChevronLeft size={15} />
          All Recipes
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-espresso">New Recipe</h2>
        <p className="text-sm text-muted mt-0.5">Build a recipe — costs calculate automatically from ingredient prices.</p>
      </div>

      <RecipeForm ingredients={ingredients} />
    </PageWrapper>
  )
}
