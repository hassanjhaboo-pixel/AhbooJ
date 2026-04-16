'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatTTD } from '@/lib/formatting'

type DayData = {
  label: string
  revenue: number
  batchCost: number
  profit: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-espresso text-cream rounded-lg px-4 py-3 shadow-xl text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex justify-between gap-6">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium">{formatTTD(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ProductionProfitChart({ data }: { data: DayData[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-12 text-center">
        <p className="text-sm text-muted">No production data for this period.</p>
      </div>
    )
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalCost    = data.reduce((s, d) => s + d.batchCost, 0)
  const totalProfit  = data.reduce((s, d) => s + d.profit, 0)
  const margin       = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatTTD(totalRevenue) },
          { label: 'Total Batch Cost', value: formatTTD(totalCost) },
          { label: 'Gross Profit', value: formatTTD(totalProfit), highlight: totalProfit > 0 },
          { label: 'Avg Margin', value: `${margin.toFixed(1)}%`, highlight: margin >= 55 },
        ].map(stat => (
          <div key={stat.label} className="bg-cream rounded-card shadow-card border border-cream/60 p-4 text-center">
            <p className={`font-display text-xl font-bold ${stat.highlight ? 'text-status-green' : 'text-espresso'}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 p-5">
        <h3 className="font-display font-semibold text-espresso mb-4">Revenue vs Cost by Production Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,30,22,0.08)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8C8177' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8C8177' }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#8C8177' }}
              formatter={v => v === 'revenue' ? 'Revenue' : v === 'batchCost' ? 'Batch Cost' : 'Profit'}
            />
            <Bar dataKey="revenue"   fill="#C9A84C" radius={[3, 3, 0, 0]} name="revenue" />
            <Bar dataKey="batchCost" fill="rgba(44,30,22,0.25)" radius={[3, 3, 0, 0]} name="batchCost" />
            <Bar dataKey="profit"    fill="#F26419" radius={[3, 3, 0, 0]} name="profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day-by-day table */}
      <div className="bg-cream rounded-card shadow-card border border-cream/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-espresso/10">
          <h3 className="font-display font-semibold text-espresso text-sm">Day-by-Day Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso/10 bg-espresso/5">
                <th className="text-left px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Revenue</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Batch Cost</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted text-xs uppercase tracking-wider">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {data.map(day => (
                <tr key={day.label} className="hover:bg-espresso/5 transition-colors">
                  <td className="px-5 py-3 font-medium text-espresso">{day.label}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-espresso">{formatTTD(day.revenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{formatTTD(day.batchCost)}</td>
                  <td className={`px-5 py-3 text-right tabular-nums font-semibold ${day.profit >= 0 ? 'text-status-green' : 'text-status-red'}`}>
                    {day.profit >= 0 ? '+' : ''}{formatTTD(day.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
