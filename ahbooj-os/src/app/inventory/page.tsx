import { Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { InventoryClient } from './_components/InventoryClient'

type Ingredient = {
  id: string
  name: string
  category: string | null
  unit: string
  cost_per_unit: number
  stock_on_hand: number
  low_stock_threshold: number
}

type Purchase = {
  id: string
  ingredient_id: string | null
  quantity_purchased: number
  unit: string
  total_price_paid: number
  cost_per_unit_calculated: number | null
  purchase_date: string
  notes: string | null
  ingredients: { id: string; name: string }[] | null
}

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: ingredientData, error: ingredientError } = await supabase
    .from('ingredients')
    .select('id, name, category, unit, cost_per_unit, stock_on_hand, low_stock_threshold')
    .order('name') as unknown as { data: Ingredient[] | null; error: { message: string } | null }

  const { data: purchaseData } = await supabase
    .from('ingredient_purchases')
    .select('id, ingredient_id, quantity_purchased, unit, total_price_paid, cost_per_unit_calculated, purchase_date, notes, ingredients(id, name)')
    .order('purchase_date', { ascending: false })
    .limit(200) as unknown as { data: Purchase[] | null; error: unknown }

  const ingredients = ingredientData ?? []
  const recentPurchases = purchaseData ?? []

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-espresso">Inventory</h2>
          <p className="text-sm text-muted mt-0.5">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {ingredientError && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-lg p-4 mb-6 text-sm text-status-red">
          Could not load inventory. Ensure the database schema has been applied in Supabase.
        </div>
      )}

      {ingredients.length === 0 && !ingredientError ? (
        <div className="bg-cream rounded-card shadow-card border border-cream/60 p-16 text-center">
          <Package size={40} className="text-muted/40 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-espresso mb-2">No ingredients yet</h3>
          <p className="text-muted text-sm">
            Apply the database schema in Supabase to seed your 27 core ingredients.
          </p>
        </div>
      ) : (
        <InventoryClient
          ingredients={ingredients}
          recentPurchases={recentPurchases}
        />
      )}
    </PageWrapper>
  )
}
