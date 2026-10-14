'use client'

import { useState, useEffect } from 'react'
import { LeadTable } from '../../../components/lead-table'
import { RefreshCw, Search, AlertCircle } from 'lucide-react'
import { BUSINESS_CATEGORIES } from '../../../lib/constants/business-categories'

export default function UncontactableLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [barangay, setBarangay] = useState('')
  const [category, setCategory] = useState('')

  const fetchUncontactableLeads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('hasContacts', 'false')
      if (query) params.append('query', query)
      if (city) params.append('city', city)
      if (barangay) params.append('barangay', barangay)
      if (category) params.append('category', category)

      const response = await fetch(`/api/v1/leads?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setLeads(data.leads)
      }
    } catch (err) {
      console.error('Error fetching uncontactable leads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUncontactableLeads()
  }, [query, city, barangay, category])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Data completion</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">Missing contacts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Businesses that still need an email address or phone number before outreach.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {leads.length} leads
          </span>
          <button
            onClick={fetchUncontactableLeads}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 border border-border rounded-xl bg-secondary text-muted-foreground hover:text-foreground cursor-pointer hover:border-amber-500/30 hover:bg-amber-500/5 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-400" />
        </div>
        <span className="relative z-10">
          <strong>Priority Rule Active:</strong> Businesses listed here cannot be reached for automated email outreach until a valid contact channel (email or phone) is attached.
        </span>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </span>
          <input
            type="text"
            placeholder="Search by business name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* City Select */}
        <div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
          >
            <option value="">All Cities</option>
            <option value="Cebu City">Cebu City</option>
            <option value="Naga City">Naga City</option>
            <option value="Merida">Merida</option>
            <option value="Ormoc City">Ormoc City</option>
          </select>
        </div>

        {/* Barangay select */}
        <div>
          <select
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
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
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
          >
            <option value="">All Categories</option>
            {BUSINESS_CATEGORIES.map((businessCategory) => (
              <option key={businessCategory} value={businessCategory}>{businessCategory}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Uncontactable Leads Table */}
      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-semibold flex flex-col items-center justify-center gap-3 dot-pattern rounded-xl border border-border">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <span>Searching uncontactable leads...</span>
        </div>
      ) : (
        <LeadTable leads={leads} />
      )}
    </div>
  )
}
