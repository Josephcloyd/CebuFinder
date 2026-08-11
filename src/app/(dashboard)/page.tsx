'use client'

import { useState, useEffect } from 'react'
import { Compass, Sparkles, AlertCircle, RefreshCw, Rocket, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { AnalyticsCharts } from '../../components/analytics-charts'
import { LeadTable } from '../../components/lead-table'
import { BUSINESS_CATEGORIES } from '../../lib/constants/business-categories'
import { DISCOVERY_CITIES, DISCOVERY_CITY_BARANGAYS, type DiscoveryCity } from '../../lib/constants/discovery-locations'

const metricCards = [
  { key: 'discovered', label: 'Discovered Leads', icon: Compass, gradient: 'from-purple-500 to-indigo-600', glowColor: 'rgba(168, 85, 247, 0.06)' },
  { key: 'needWebsite', label: 'Need Website', icon: AlertCircle, gradient: 'from-amber-500 to-orange-600', glowColor: 'rgba(245, 158, 11, 0.06)' },
  { key: 'approved', label: 'Approved Outreach', icon: Target, gradient: 'from-blue-500 to-cyan-600', glowColor: 'rgba(59, 130, 246, 0.06)' },
  { key: 'replyRate', label: 'Response Rate', icon: TrendingUp, gradient: 'from-emerald-500 to-green-600', glowColor: 'rgba(16, 185, 129, 0.06)' },
]

export default function OverviewPage() {
  const [stats, setStats] = useState({
    discovered: 0,
    needWebsite: 0,
    approved: 0,
    replyRate: '0%',
  })
  
  const [leads, setLeads] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Form State
  const [city, setCity] = useState<DiscoveryCity>('Cebu City')
  const [category, setCategory] = useState('Dental Clinic')
  const [barangay, setBarangay] = useState('')
  const [isQueuing, setIsQueuing] = useState(false)
  const [queueMessage, setQueueMessage] = useState('')

  const fetchDashboardData = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/v1/leads')
      const data = await response.json()
      
      if (data.success) {
        const allLeads = data.leads
        setLeads(allLeads.slice(0, 5))

        const discovered = allLeads.length
        const needWebsite = allLeads.filter((l: any) => 
          l.digitalPresence?.websiteStatus === 'NO_WEBSITE' || 
          l.digitalPresence?.websiteStatus === 'FACEBOOK_ONLY' || 
          l.digitalPresence?.websiteStatus === 'BROKEN_SITE'
        ).length

        const approved = allLeads.filter((l: any) => 
          l.outreach?.[0]?.status === 'APPROVED' || 
          l.outreach?.[0]?.status === 'SENT'
        ).length

        const replied = allLeads.filter((l: any) => l.outreach?.[0]?.status === 'REPLIED').length
        const sent = allLeads.filter((l: any) => l.outreach?.[0]?.status === 'SENT').length
        
        const rate = sent > 0 ? `${Math.round((replied / sent) * 100)}%` : '0%'

        setStats({
          discovered,
          needWebsite,
          approved,
          replyRate: rate,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleStartCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsQueuing(true)
    setQueueMessage('')
    
    try {
      const response = await fetch('/api/v1/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, barangay, city })
      })
      const result = await response.json()
      
      if (result.success) {
        setQueueMessage(`✓ Job queued successfully! Job ID: ${result.jobId}`)
        setTimeout(() => {
          fetchDashboardData()
        }, 1500)
      } else {
        setQueueMessage(`✕ Error: ${result.error}`)
      }
    } catch (err: any) {
      setQueueMessage(`✕ Connection Error: ${err.message}`)
    } finally {
      setIsQueuing(false)
    }
  }

  const chartsData = {
    barangayData: [
      { name: 'Lahug', count: Math.max(2, Math.floor(stats.discovered * 0.4)) },
      { name: 'Mabolo', count: Math.max(1, Math.floor(stats.discovered * 0.25)) },
      { name: 'Banilad', count: Math.max(1, Math.floor(stats.discovered * 0.15)) },
      { name: 'Kamputhaw', count: Math.max(1, Math.floor(stats.discovered * 0.12)) },
      { name: 'Kasambagan', count: Math.max(0, Math.floor(stats.discovered * 0.08)) },
    ],
    categoryData: [
      { name: 'Dental Clinic', value: Math.max(2, Math.floor(stats.discovered * 0.5)) },
      { name: 'Restaurant', value: Math.max(1, Math.floor(stats.discovered * 0.3)) },
      { name: 'Salon', value: Math.max(1, Math.floor(stats.discovered * 0.2)) },
    ],
    funnelData: [
      { name: 'Discovered', count: stats.discovered, percentage: 100 },
      { name: 'Audited', count: stats.discovered, percentage: 100 },
      { name: 'Approved', count: stats.approved, percentage: stats.discovered > 0 ? Math.round((stats.approved / stats.discovered) * 100) : 0 },
      { name: 'Replied', count: Math.floor(stats.approved * 0.2), percentage: stats.approved > 0 ? 20 : 0 },
    ],
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="text-3xl font-black gradient-text">Performance Overview</h2>
          <p className="text-sm text-zinc-500 mt-1.5">Lead intelligence, opportunity discovery, and campaign orchestration</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 border border-zinc-800/60 rounded-xl bg-zinc-900/50 text-zinc-400 hover:text-white cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 stagger-enter">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          const value = (stats as any)[metric.key]
          return (
            <div key={metric.key} className="glass-card metric-card rounded-xl p-6 flex items-center justify-between" style={{ '--glow-color': metric.glowColor } as any}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{metric.label}</span>
                <h3 className="text-4xl font-black mt-2 text-white tracking-tight">{value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Campaign Launcher Panel & Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Campaign Launcher */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Launch Discovery Campaign</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
              Discover local businesses via OpenStreetMap Overpass with intelligent search engine fallbacks across your target cities.
            </p>

            <form onSubmit={handleStartCampaign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Target City / Municipality</label>
                <select
                  value={city}
                  onChange={(e) => {
                    const selectedCity = e.target.value as DiscoveryCity
                    setCity(selectedCity)
                    setBarangay('')
                  }}
                  className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  {DISCOVERY_CITIES.map((item) => (
                    <option key={item} value={item}>{item} (Cebu)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Target Area / Barangay</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  <option value="">All Barangays in {city}</option>
                  {DISCOVERY_CITY_BARANGAYS[city].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Business Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  {BUSINESS_CATEGORIES.map((businessCategory) => (
                    <option key={businessCategory} value={businessCategory}>{businessCategory}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isQueuing}
                className="w-full btn-primary text-white font-bold py-3 px-4 rounded-xl text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isQueuing ? 'Queuing Search...' : 'Launch Discovery'}
              </button>
            </form>
          </div>

          {queueMessage && (
            <div className={`mt-4 text-xs font-semibold p-3 rounded-xl border ${queueMessage.startsWith('✓') ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {queueMessage}
            </div>
          )}
        </div>

        {/* Analytics Charts */}
        <div className="xl:col-span-2">
          <AnalyticsCharts data={chartsData} />
        </div>
      </div>

      {/* Recent Discovered Leads */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Recent Discovered Leads</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">{leads.length} shown</span>
        </div>
        <LeadTable leads={leads} />
      </div>
    </div>
  )
}
