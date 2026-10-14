'use client'

import { useEffect, useMemo, useState } from 'react'
import { Compass, RefreshCw, Send, TriangleAlert, UsersRound } from 'lucide-react'
import { AnalyticsCharts } from '../../components/analytics-charts'

export default function OverviewPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loadError, setLoadError] = useState('')

  const fetchDashboardData = async () => {
    setIsRefreshing(true)
    setLoadError('')
    try {
      const response = await fetch('/api/v1/leads')
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load leads')
      setLeads(data.leads)
      setLastUpdated(new Date())
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load the workspace')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const stats = useMemo(() => {
    const needWebsite = leads.filter((lead) => ['NO_WEBSITE', 'FACEBOOK_ONLY', 'BROKEN_SITE'].includes(lead.digitalPresence?.websiteStatus)).length
    const approved = leads.filter((lead) => ['APPROVED', 'SENT'].includes(lead.outreach?.[0]?.status)).length
    const sent = leads.filter((lead) => lead.outreach?.[0]?.status === 'SENT').length
    const replied = leads.filter((lead) => lead.outreach?.[0]?.status === 'REPLIED').length
    const reachable = leads.filter((lead) => lead.contacts?.length > 0).length
    return {
      discovered: leads.length,
      needWebsite,
      reachable,
      approved,
      replied,
      replyRate: sent > 0 ? `${Math.round((replied / sent) * 100)}%` : '0%',
    }
  }, [leads])

  const chartsData = useMemo(() => {
    const barangays = new Map<string, number>()
    const categories = new Map<string, number>()
    leads.forEach((lead) => {
      barangays.set(lead.barangay || 'Unknown', (barangays.get(lead.barangay || 'Unknown') || 0) + 1)
      categories.set(lead.businessCategory || 'Other', (categories.get(lead.businessCategory || 'Other') || 0) + 1)
    })
    return {
      barangayData: [...barangays.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
      categoryData: [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value })),
      funnelData: [
        { name: 'Discovered', count: stats.discovered, percentage: 100 },
        { name: 'Reachable', count: stats.reachable, percentage: stats.discovered ? Math.round((stats.reachable / stats.discovered) * 100) : 0 },
        { name: 'Approved', count: stats.approved, percentage: stats.discovered ? Math.round((stats.approved / stats.discovered) * 100) : 0 },
        { name: 'Replied', count: stats.replied, percentage: stats.discovered ? Math.round((stats.replied / stats.discovered) * 100) : 0 },
      ],
    }
  }, [leads, stats])

  const metrics = [
    { label: 'Businesses found', value: stats.discovered, note: 'Total records', icon: Compass },
    { label: 'Need digital help', value: stats.needWebsite, note: 'No site or limited presence', icon: TriangleAlert },
    { label: 'Reachable leads', value: stats.reachable, note: 'At least one contact', icon: UsersRound },
    { label: 'Approved outreach', value: stats.approved, note: `${stats.replyRate} response rate`, icon: Send },
  ]

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Workspace overview</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">Cebu lead operations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Find local businesses, assess their digital presence, and move qualified opportunities into outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="hidden text-xs text-muted-foreground sm:inline">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      {loadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <TriangleAlert className="h-4 w-4" />
          {loadError}
        </div>
      )}

      <section className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className={`p-5 ${index > 0 ? 'border-t border-border sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 xl:border-l' : ''}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
            </div>
          )
        })}
      </section>

      <section>
        <AnalyticsCharts data={chartsData} />
      </section>

    </div>
  )
}
