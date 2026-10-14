'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Search, Sparkles, MoveRight, CheckCircle, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react'
import { PitchGeneratorModal } from '../../../components/pitch-generator-modal'
import { BUSINESS_CATEGORIES } from '../../../lib/constants/business-categories'

export default function KanbanPipelinePage() {
  const [pipelineData, setPipelineData] = useState<{
    DISCOVERED: any[]
    AUDITED: any[]
    PITCH_DRAFTED: any[]
    CONTACTED: any[]
    CONVERTED: any[]
  }>({
    DISCOVERED: [],
    AUDITED: [],
    PITCH_DRAFTED: [],
    CONTACTED: [],
    CONVERTED: [],
  })

  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState('ALL')
  const [category, setCategory] = useState('ALL')

  // Pitch Modal State
  const [pitchModalLeadId, setPitchModalLeadId] = useState<string | null>(null)
  const [pitchModalLeadName, setPitchModalLeadName] = useState<string>('')

  const fetchPipeline = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (barangay !== 'ALL') params.append('barangay', barangay)
      if (category !== 'ALL') params.append('category', category)

      const res = await fetch(`/api/v1/pipeline?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setPipelineData(data.columns)
        setTotalCount(data.totalCount)
      }
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPipeline()
  }, [query, barangay, category])

  const moveStage = async (businessId: string, targetStage: string) => {
    try {
      const res = await fetch('/api/v1/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, targetStage }),
      })
      const data = await res.json()
      if (data.success) {
        fetchPipeline()
      }
    } catch (err) {
      console.error('Error moving lead stage:', err)
    }
  }

  const columnsConfig = [
    { key: 'DISCOVERED', title: 'Discovered', icon: Search, color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
    { key: 'AUDITED', title: 'Audited', icon: ShieldAlert, color: 'border-primary/50 text-primary bg-primary/10' },
    { key: 'PITCH_DRAFTED', title: 'Pitch Drafted', icon: Sparkles, color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
    { key: 'CONTACTED', title: 'Contacted', icon: ArrowRight, color: 'border-teal-500/40 text-teal-400 bg-teal-500/10' },
    { key: 'CONVERTED', title: 'Converted / Won', icon: CheckCircle, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  ]

  const getWebsiteBadge = (status: string) => {
    if (status === 'FULLY_FUNCTIONAL') return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">🟢 Functional</span>
    if (status === 'FACEBOOK_ONLY') return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">🟡 FB Only</span>
    return <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">🔴 No Website</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Opportunity tracking</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">Sales pipeline</h1>
          <p className="mt-2 text-sm text-muted-foreground">Move leads from discovery through qualification, outreach, and conversion.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPipeline}
            disabled={isLoading}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Board
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
        <div>
          <input
            type="text"
            placeholder="Search business name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Barangays</option>
            <option value="Lahug">Lahug</option>
            <option value="Mabolo">Mabolo</option>
            <option value="Banilad">Banilad</option>
            <option value="Talamban">Talamban</option>
            <option value="Guadalupe">Guadalupe</option>
            <option value="Capitol Site">Capitol Site</option>
          </select>
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Categories</option>
            {BUSINESS_CATEGORIES.map((businessCategory) => (
              <option key={businessCategory} value={businessCategory}>{businessCategory}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban 5 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {columnsConfig.map((col) => {
          const leadsList = (pipelineData as any)[col.key] || []
          const Icon = col.icon

          return (
            <div key={col.key} className="flex flex-col rounded-xl bg-background border border-border/80 p-3 min-w-[240px] min-h-[650px]">
              {/* Column Header */}
              <div className="flex items-center justify-between p-2.5 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">{col.title}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${col.color}`}>
                  {leadsList.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {leadsList.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl bg-secondary border border-border hover:border-primary/50 transition-all space-y-3 group"
                  >
                    {/* Header: Name & Score */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {lead.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {lead.leadScore}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>📍 {lead.barangay}</span>
                      <span>{getWebsiteBadge(lead.websiteStatus)}</span>
                    </div>

                    {/* Problem Summary */}
                    <p className="text-[10px] text-muted-foreground line-clamp-2 bg-background/90 p-2 rounded-lg border border-border">
                      {lead.primaryProblem}
                    </p>

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <button
                        onClick={() => {
                          setPitchModalLeadId(lead.id)
                          setPitchModalLeadName(lead.name)
                        }}
                        className="text-[10px] font-bold text-primary hover:text-primary flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-primary" />
                        AI Pitch
                      </button>

                      {/* Move Stage Selector */}
                      <select
                        value={col.key}
                        onChange={(e) => moveStage(lead.id, e.target.value)}
                        className="bg-background border border-border text-[10px] text-muted-foreground rounded px-1.5 py-0.5 focus:outline-none"
                      >
                        <option value="DISCOVERED">Discovered</option>
                        <option value="AUDITED">Audited</option>
                        <option value="PITCH_DRAFTED">Pitch Drafted</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONVERTED">Converted</option>
                      </select>
                    </div>
                  </div>
                ))}

                {leadsList.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-[11px] text-muted-foreground font-semibold">
                    No leads in {col.title}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pitch Generator Modal */}
      <PitchGeneratorModal
        isOpen={!!pitchModalLeadId}
        onClose={() => setPitchModalLeadId(null)}
        businessId={pitchModalLeadId}
        businessName={pitchModalLeadName}
      />
    </div>
  )
}
