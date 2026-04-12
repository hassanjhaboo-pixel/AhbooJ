// ============================================================
// AhbooJ Pricing & Costing Engine
// Ingredient cost rule: always = total_price_paid / total_quantity_purchased
// No estimates when real data exists.
// ============================================================

export const MARGIN_RULES = {
  direct_floor:  55,  // below → amber warning
  direct_strong: 65,  // above → strong green
  cafe_floor:    35,  // below → red, unsustainable
  cafe_danger:   45,  // below → amber monitor
} as const

export type MarginStatus = 'strong' | 'healthy' | 'warning' | 'danger'
export type Channel = 'direct' | 'cafe'

// ── Margin calculation ──────────────────────────────────────

export function calcMargin(price: number, cost: number): number {
  if (price <= 0 || cost < 0) return 0
  return ((price - cost) / price) * 100
}

export function marginStatus(margin: number, channel: Channel): MarginStatus {
  if (channel === 'direct') {
    if (margin >= MARGIN_RULES.direct_strong) return 'strong'
    if (margin >= MARGIN_RULES.direct_floor)  return 'healthy'
    if (margin >= MARGIN_RULES.cafe_floor)    return 'warning'
    return 'danger'
  }
  // cafe
  if (margin >= MARGIN_RULES.direct_strong) return 'strong'
  if (margin >= MARGIN_RULES.cafe_danger)   return 'healthy'
  if (margin >= MARGIN_RULES.cafe_floor)    return 'warning'
  return 'danger'
}

export function marginStatusLabel(status: MarginStatus): string {
  return { strong: 'Strong', healthy: 'Healthy', warning: 'Warning', danger: 'Unsustainable' }[status]
}

// Badge variant for margin status
export function marginStatusVariant(status: MarginStatus): 'green' | 'amber' | 'red' | 'gold' {
  return { strong: 'green', healthy: 'gold', warning: 'amber', danger: 'red' }[status] as 'green' | 'amber' | 'red' | 'gold'
}

// ── Cost calculation ────────────────────────────────────────

export function calcBatchCost(
  ingredients: Array<{ quantity: number; cost_per_unit: number }>
): number {
  return ingredients.reduce((sum, i) => sum + i.quantity * i.cost_per_unit, 0)
}

export function calcCostPerUnit(batchCost: number, yieldUnits: number): number {
  if (yieldUnits <= 0) return 0
  return batchCost / yieldUnits
}

// ── Price floor calculation ─────────────────────────────────

/** Minimum price to achieve a given margin floor: price = cost / (1 - margin/100) */
export function calcMinPrice(cost: number, targetMarginPct: number): number {
  if (targetMarginPct >= 100) return cost * 100
  if (targetMarginPct <= 0)   return cost
  return cost / (1 - targetMarginPct / 100)
}

/** Round up to nearest step (default TT$5). Used to suggest clean prices. */
export function roundUpToStep(value: number, step = 5): number {
  return Math.ceil(value / step) * step
}

/** Suggest direct sale price: floor at 55% margin, rounded to nearest $5 */
export function suggestDirectPrice(costPerUnit: number): number {
  const min = calcMinPrice(costPerUnit, MARGIN_RULES.direct_floor)
  return roundUpToStep(min, 5)
}

/** Suggest café wholesale price: floor at 35% margin, rounded to nearest $5 */
export function suggestCafePrice(costPerUnit: number): number {
  const min = calcMinPrice(costPerUnit, MARGIN_RULES.cafe_floor)
  return roundUpToStep(min, 5)
}

// ── Scaling ─────────────────────────────────────────────────

export interface ScaledIngredient {
  id: string
  name: string
  unit: string
  baseQty: number
  scaledQty: number
  costPerUnit: number
  lineCost: number
}

export function scaleIngredients(
  ingredients: Array<{ id: string; name: string; unit: string; quantity: number; cost_per_unit: number }>,
  batchCount: number
): ScaledIngredient[] {
  return ingredients.map(i => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    baseQty: i.quantity,
    scaledQty: i.quantity * batchCount,
    costPerUnit: i.cost_per_unit,
    lineCost: i.quantity * batchCount * i.cost_per_unit,
  }))
}
