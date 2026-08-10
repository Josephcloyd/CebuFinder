'use client'

import { useState, useEffect } from 'react'
import { Inbox, Compass, Users, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import { AnalyticsCharts } from '../../components/analytics-charts'
import { LeadTable } from '../../components/lead-table'

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
  const [category, setCategory] = useState('Dental Clinic')
  const [barangay, setBarangay] = useState('Lahug')
  const [isQueuing, setIsQueuing] = useState(false)
  const [queueMessage, setQueueMessage] = useState('')

  const fetchDashboardData = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/v1/leads')
      const data = await response.json()
      
      if (data.success) {
        const allLeads = data.leads
        setLeads(allLeads.slice(0, 5)) // show top 5 recent

        // Compute metrics
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
        body: JSON.stringify({ category, barangay })
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

  // Mock charts data based on Cebu database
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Performance Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">Lead intelligence, opportunity discovery, and campaign orchestration</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Discovered leads</span>
            <h3 className="text-4xl font-black mt-2 text-white">{stats.discovered}</h3>
          </div>
          <Compass className="w-8 h-8 text-purple-500 bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20" />
        </div>

        <div className="glass rounded-xl p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Need Website</span>
            <h3 className="text-4xl font-black mt-2 text-white">{stats.needWebsite}</h3>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-500 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20" />
        </div>

        <div className="glass rounded-xl p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Approved Outreach</span>
            <h3 className="text-4xl font-black mt-2 text-white">{stats.approved}</h3>
          </div>
          <Inbox className="w-8 h-8 text-blue-500 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20" />
        </div>

        <div className="glass rounded-xl p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Response Rate</span>
            <h3 className="text-4xl font-black mt-2 text-white">{stats.replyRate}</h3>
          </div>
          <Users className="w-8 h-8 text-green-500 bg-green-500/10 p-1.5 rounded-lg border border-green-500/20" />
        </div>
      </div>

      {/* Campaign Launcher Panel & Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Campaign Launcher */}
        <div className="glass rounded-xl p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Start Local Discovery Campaign</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Launch a systematic OpenStreetMap Overpass search combined with public search engine fallbacks. This discovery scans matching local businesses in Cebu City.
            </p>

            <form onSubmit={handleStartCampaign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Target Barangay</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="Lahug">Lahug (IT Park Area)</option>
                  <option value="Mabolo">Mabolo</option>
                  <option value="Banilad">Banilad</option>
                  <option value="Kamputhaw">Kamputhaw (Ayala / Gorordo)</option>
                  <option value="Kasambagan">Kasambagan</option>
                  <option value="Guadalupe">Guadalupe</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Business Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="Dental Clinic">Dental Clinic</option>
                  <option value="Medical Clinic">Medical Clinic</option>
                  <option value="Restaurant">Restaurants & Cafes</option>
                  <option value="Salon">Salons & Barbershops</option>
                  <option value="Gym">Gyms & Fitness Centres</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isQueuing}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-50"
              >
                {isQueuing ? 'Queuing Search...' : 'Launch Discovery'}
              </button>
            </form>
          </div>

          {queueMessage && (
            <div className={`mt-4 text-xs font-semibold p-3 rounded-lg border ${queueMessage.startsWith('✓') ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
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
        <h3 className="text-xl font-bold text-white">Recent Discovered Leads</h3>
        <LeadTable leads={leads} />
      </div>
    </div>
  )
}
