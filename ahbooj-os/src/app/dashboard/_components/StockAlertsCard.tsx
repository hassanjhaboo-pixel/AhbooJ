import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { Ingredient } from '@/types/database'

interface StockAlertsCardProps {
  alerts: Ingredient[]
}

export function StockAlertsCard({ alerts }: StockAlertsCardProps) {
  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-espresso">Stock Alerts</h3>
        {alerts.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-red/15 text-status-red border border-status-red/30">
            {alerts.length} low
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-8 h-8 rounded-full bg-status-green/15 flex items-center justify-center mx-auto mb-2">
            <span className="text-status-green text-sm">✓</span>
          </div>
          <p className="text-sm text-muted">All stock levels healthy</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 6).map(ing => (
            <li key={ing.id} className="flex items-center justify-between py-1.5 border-b border-espresso/5 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={13} className="text-status-amber flex-shrink-0" />
                <span className="text-sm text-espresso truncate">{ing.name}</span>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <span className="text-xs text-status-red font-medium">
                  {ing.stock_on_hand}{ing.unit}
                </span>
                <span className="text-xs text-muted"> / {ing.low_stock_threshold}{ing.unit}</span>
              </div>
            </li>
          ))}
          {alerts.length > 6 && (
            <li className="pt-1">
              <Link href="/inventory" className="text-xs text-terracotta hover:underline">
                +{alerts.length - 6} more →
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
