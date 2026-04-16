import { Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CategoriesClient } from './_components/CategoriesClient'

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const categories = (data ?? []) as {
    id: string; name: string; slug: string;
    applies_to: string[]; sort_order: number; notes: string | null
  }[]

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-terracotta" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-espresso">Categories</h1>
            <p className="text-sm text-muted">Manage labels for products, recipes, and ingredients</p>
          </div>
        </div>

        <CategoriesClient initial={categories} />
      </div>
    </PageWrapper>
  )
}
