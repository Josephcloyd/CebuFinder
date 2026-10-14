'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface AnalyticsChartsProps {
  data: {
    barangayData: Array<{ name: string; count: number }>
    categoryData: Array<{ name: string; value: number }>
    funnelData: Array<{ name: string; count: number; percentage: number }>
  }
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{payload[0].value} leads</p>
    </div>
  )
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const totalCategories = data.categoryData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Lead distribution</h2>
        <p className="mt-1 text-sm text-muted-foreground">Where current opportunities are concentrated.</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,.65fr)]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <p className="mb-4 text-xs font-medium text-muted-foreground">Top barangays</p>
          {data.barangayData.length ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.barangayData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e2db" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#727775', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#727775', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(66, 104, 90, 0.05)' }} />
                  <Bar dataKey="count" fill="#42685a" radius={[3, 3, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No distribution data yet</div>
          )}
        </div>

        <div className="p-5">
          <p className="mb-4 text-xs font-medium text-muted-foreground">Top categories</p>
          <div className="space-y-4">
            {data.categoryData.length ? data.categoryData.map((item) => {
              const percentage = totalCategories ? Math.round((item.value / totalCategories) * 100) : 0
              return (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-[#b5a58d]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            }) : <p className="text-sm text-muted-foreground">No category data yet</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Pipeline progress</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {data.funnelData.map((step) => (
            <div key={step.name}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-semibold text-foreground">{step.count}</span>
                <span className="text-[11px] text-muted-foreground">{step.percentage}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{step.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
