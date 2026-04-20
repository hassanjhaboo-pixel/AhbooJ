import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { propagateIngredientCost } from '@/lib/propagate-cost'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ingredientId } = await params
  console.log(`[api/propagate-cost] start for ingredient ${ingredientId}`)

  const supabase = createAdminClient()
  const result = await propagateIngredientCost(supabase, ingredientId)

  console.log(`[api/propagate-cost] complete:`, result)
  return NextResponse.json({ ingredientId, ...result })
}
