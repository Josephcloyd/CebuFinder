'use client'

import { useState, useEffect } from 'react'
import { Columns, RefreshCw, Search, Sparkles, MoveRight, CheckCircle, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react'
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
    { key: 'AUDITED', title: 'Audited', icon: ShieldAlert, color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
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
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Columns className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black gradient-text">Kanban CRM Pipeline</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Drag-and-drop lead lifecycle management from discovery to conversion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPipeline}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Board
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl glass-card">
        <div>
          <input
            type="text"
            placeholder="Search business name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div>
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
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
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
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
            <div key={col.key} className="flex flex-col rounded-2xl bg-zinc-950/80 border border-zinc-900/80 p-3 min-w-[240px] min-h-[650px]">
              {/* Column Header */}
              <div className="flex items-center justify-between p-2.5 mb-3 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold text-white">{col.title}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${col.color}`}>
                  {leadsList.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {leadsList.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 hover:border-purple-500/40 transition-all space-y-3 group"
                  >
                    {/* Header: Name & Score */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                        {lead.name}
                      </h4>
                      <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        {lead.leadScore}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                      <span>📍 {lead.barangay}</span>
                      <span>{getWebsiteBadge(lead.websiteStatus)}</span>
                    </div>

                    {/* Problem Summary */}
                    <p className="text-[10px] text-zinc-400 line-clamp-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/40">
                      {lead.primaryProblem}
                    </p>

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40">
                      <button
                        onClick={() => {
                          setPitchModalLeadId(lead.id)
                          setPitchModalLeadName(lead.name)
                        }}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        AI Pitch
                      </button>

                      {/* Move Stage Selector */}
                      <select
                        value={col.key}
                        onChange={(e) => moveStage(lead.id, e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 rounded px-1.5 py-0.5 focus:outline-none"
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
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-xl text-[11px] text-zinc-600 font-semibold">
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
