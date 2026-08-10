'use client'

import { useState, useEffect } from 'react'
import { LeadTable } from '../../../components/lead-table'
import { RefreshCw, Search } from 'lucide-react'

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [query, setQuery] = useState('')
  const [barangay, setBarangay] = useState('')
  const [category, setCategory] = useState('')
  const [minScore, setMinScore] = useState('')

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (barangay) params.append('barangay', barangay)
      if (category) params.append('category', category)
      if (minScore) params.append('minScore', minScore)

      const response = await fetch(`/api/v1/leads?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setLeads(data.leads)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [query, barangay, category, minScore])

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Leads Database (CRM)</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage and audit all discovered businesses and digital status profiles.</p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Database
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-zinc-900/30 border border-zinc-900">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500" />
          </span>
          <input
            type="text"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Barangay select */}
        <div>
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-purple-500"
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
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            <option value="Dental Clinic">Dental Clinic</option>
            <option value="Medical Clinic">Medical Clinic</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Salon">Salon</option>
            <option value="Gym">Gym</option>
          </select>
        </div>

        {/* Min Score select */}
        <div>
          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-purple-500"
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
        <div className="py-24 text-center text-zinc-500 font-semibold flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <span>Searching database...</span>
        </div>
      ) : (
        <LeadTable leads={leads} />
      )}
    </div>
  )
}
