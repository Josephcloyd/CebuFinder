'use client'

import { useState, useEffect } from 'react'
import { LeadTable } from '../../../components/lead-table'
import { RefreshCw, Search, Star, List, AlertTriangle, Users, Database } from 'lucide-react'
import { ExportLeadsButton } from '../../../components/export-leads-button'
import { BUSINESS_CATEGORIES } from '../../../lib/constants/business-categories'

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState('')
  const [category, setCategory] = useState('')
  const [minScore, setMinScore] = useState('')
  
  // Priority Rule: Default to 'true' (only leads with Email or Phone)
  const [hasContacts, setHasContacts] = useState('true')

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (hasContacts) params.append('hasContacts', hasContacts)
      if (query) params.append('query', query)
      if (barangay) params.append('barangay', barangay)
      if (category) params.append('category', category)
      if (minScore) params.append('minScore', minScore)

      const response = await fetch(`/api/v1/leads?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setLeads(data.leads)
        setTotalCount(data.leads.length)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [query, barangay, category, minScore, hasContacts])

  const tabs = [
    { id: 'true', label: 'Priority Leads', subtitle: 'Email or Phone', icon: Star, activeColor: 'bg-purple-600 shadow-purple-500/25', inactiveColor: 'border-zinc-800/60' },
    { id: '', label: 'All Discovered', subtitle: 'Complete List', icon: List, activeColor: 'bg-purple-600 shadow-purple-500/25', inactiveColor: 'border-zinc-800/60' },
    { id: 'false', label: 'Needs Contact', subtitle: 'Missing Info', icon: AlertTriangle, activeColor: 'bg-amber-600 shadow-amber-500/25', inactiveColor: 'border-zinc-800/60' },
  ]

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black gradient-text">Leads Database</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Manage and audit all discovered businesses and digital status profiles.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportLeadsButton
            hasContacts={hasContacts === 'true' ? true : hasContacts === 'false' ? false : undefined}
            barangay={barangay}
            category={category}
          />
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-zinc-400">
            {totalCount} results
          </span>
          <button
            onClick={fetchLeads}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 border border-zinc-800/60 rounded-xl bg-zinc-900/50 text-zinc-400 hover:text-white cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Priority Rule Tabs */}
      <div className="flex items-center gap-3">
        {tabs.map((tab) => {
          const isActive = hasContacts === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setHasContacts(tab.id)}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                isActive
                  ? `${tab.activeColor} text-white shadow-lg`
                  : `bg-zinc-900/60 text-zinc-400 hover:text-white ${tab.inactiveColor} border`
              }`}
            >
              <Icon className="w-4 h-4" />
              <div className="text-left">
                <div>{tab.label}</div>
                <div className={`text-[10px] font-normal ${isActive ? 'text-white/70' : 'text-zinc-600'}`}>{tab.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl glass-card">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-600" />
          </span>
          <input
            type="text"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Barangay select */}
        <div>
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-400 focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="">All Barangays</option>
            <option value="Lahug">Lahug</option>
            <option value="Mabolo">Mabolo</option>
            <option value="Banilad">Banilad</option>
            <option value="Kamputhaw">Kamputhaw</option>
            <option value="Kasambagan">Kasambagan</option>
            <option value="Guadalupe">Guadalupe</option>
          </select>
        </div>

        {/* Category select */}
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-400 focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="">All Categories</option>
            {BUSINESS_CATEGORIES.map((businessCategory) => (
              <option key={businessCategory} value={businessCategory}>{businessCategory}</option>
            ))}
          </select>
        </div>

        {/* Min Score select */}
        <div>
          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-400 focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="">Any Score</option>
            <option value="90">90+ Excellent Opportunity</option>
            <option value="80">80+ High Priority</option>
            <option value="70">70+ Moderate Priority</option>
            <option value="50">50+ Lower Priority</option>
          </select>
        </div>
      </div>

      {/* CRM Database Table */}
      {isLoading ? (
        <div className="py-24 text-center text-zinc-500 font-semibold flex flex-col items-center justify-center gap-3 dot-pattern rounded-xl border border-zinc-900/50">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <span>Searching database...</span>
        </div>
      ) : (
        <LeadTable leads={leads} />
      )}
    </div>
  )
}
