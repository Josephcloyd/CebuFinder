'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, RefreshCw, ShieldAlert, Sparkles, X, ExternalLink, Globe, Building2, AlertCircle, Layers, SlidersHorizontal, ChevronDown, Flame } from 'lucide-react'
import { PitchGeneratorModal } from '../../../components/pitch-generator-modal'
import { BUSINESS_CATEGORIES } from '../../../lib/constants/business-categories'

// Dynamically import Leaflet Map to avoid SSR window error
const CebuMap = dynamic(
  () => import('../../../components/cebu-map').then((mod) => mod.CebuMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center mx-auto animate-pulse">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm font-semibold">Loading Cebu Map...</p>
        </div>
      </div>
    ),
  }
)

export default function CebuMapExplorerPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Pitch Modal State
  const [pitchModalLeadId, setPitchModalLeadId] = useState<string | null>(null)
  const [pitchModalLeadName, setPitchModalLeadName] = useState<string>('')

  // View mode toggle (pins vs heatmap)
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap'>('pins')

  // Filters
  const [city, setCity] = useState('ALL')
  const [barangay, setBarangay] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [status, setStatus] = useState('ALL')

  const fetchMapLeads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (city !== 'ALL') params.append('city', city)
      if (barangay !== 'ALL') params.append('barangay', barangay)
      if (category !== 'ALL') params.append('category', category)
      if (status !== 'ALL') params.append('status', status)

      const res = await fetch(`/api/v1/map-leads?${params.toString()}`)
      const data = await res.json()
      if (data.success) setLeads(data.leads)
    } catch (err) {
      console.error('Failed to fetch map leads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMapLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, barangay, category, status])

  // Stats
  const highOpportunityCount = leads.filter(
    (l) => l.websiteStatus === 'NO_WEBSITE' || l.websiteStatus === 'BROKEN_SITE'
  ).length
  const fbOnlyCount = leads.filter((l) => l.websiteStatus === 'FACEBOOK_ONLY').length

  const getStatusPill = (statusStr: string) => {
    if (statusStr === 'FULLY_FUNCTIONAL')
      return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">🟢 Functional Website</span>
    if (statusStr === 'FACEBOOK_ONLY')
      return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">🟡 Facebook Only</span>
    return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">🔴 No Website / Broken</span>
  }

  const activeFilterCount = [city, barangay, category, status].filter((v) => v !== 'ALL').length

  return (
    // Full-screen container: fills the parent dashboard content area
    <div className="relative flex w-full flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── TOP HUD BAR ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1001] flex flex-wrap items-start gap-2 sm:left-4 sm:right-4 sm:top-4">

        {/* Title chip */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-border bg-card/95 px-3 py-2 backdrop-blur-md sm:px-4">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg ">
            <MapPin className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-none text-foreground">Map explorer</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Click any pin to inspect</p>
          </div>
        </div>

        {/* Stats chips */}
        <div className="pointer-events-auto hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/95 px-3.5 py-2 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{leads.length}</span>
            <span className="text-[10px] text-muted-foreground">Businesses</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-card/95 px-3.5 py-2 backdrop-blur-md">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-400">{highOpportunityCount}</span>
            <span className="text-[10px] text-muted-foreground">No Website</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-card/95 px-3.5 py-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">{fbOnlyCount}</span>
            <span className="text-[10px] text-muted-foreground">FB Only</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium backdrop-blur-md transition-colors ${
              showFilters
                ? 'bg-primary border-primary text-foreground'
                : 'bg-card/95 border-border text-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchMapLeads}
            disabled={isLoading}
            className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card/95 px-3 text-xs font-medium text-foreground backdrop-blur-md transition-colors hover:bg-secondary disabled:opacity-50 sm:flex"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-1 backdrop-blur-md">
            <button
              onClick={() => setViewMode('pins')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${viewMode === 'pins' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Pins
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${viewMode === 'heatmap' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Flame className="w-3.5 h-3.5" /> Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER PANEL (dropdown below top bar) ───────────────── */}
      {showFilters && (
        <div className="absolute right-3 top-[64px] z-[1001] w-[calc(100%-1.5rem)] max-w-72 space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:right-4 sm:top-[72px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Filter Businesses</span>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setCity('ALL'); setBarangay('ALL'); setCategory('ALL'); setStatus('ALL') }}
                className="text-[10px] text-primary hover:text-primary font-semibold transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {[
            { label: 'City', value: city, setter: setCity, options: [['ALL', 'All Cities'], ['Cebu City', 'Cebu City'], ['Mandaue', 'Mandaue City'], ['Lapu-Lapu', 'Lapu-Lapu City'], ['Talisay', 'Talisay City']] },
            { label: 'Barangay / District', value: barangay, setter: setBarangay, options: [['ALL', 'All Barangays'], ['Lahug', 'Lahug'], ['Mabolo', 'Mabolo'], ['Banilad', 'Banilad'], ['Talamban', 'Talamban'], ['Guadalupe', 'Guadalupe'], ['Capitol Site', 'Capitol Site'], ['IT Park', 'IT Park']] },
            { label: 'Category', value: category, setter: setCategory, options: [['ALL', 'All Categories'], ...BUSINESS_CATEGORIES.map((businessCategory) => [businessCategory, businessCategory])] },
            { label: 'Digital Gap Status', value: status, setter: setStatus, options: [['ALL', 'All Statuses'], ['NO_WEBSITE', '🔴 No Website / Broken'], ['FACEBOOK_ONLY', '🟡 Facebook Only'], ['FULLY_FUNCTIONAL', '🟢 Functional Website']] },
          ].map(({ label, value, setter, options }) => (
            <div key={label}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                {options.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* ── FULL-SCREEN MAP ──────────────────────────────────────── */}
      <div className="absolute inset-0 rounded-none overflow-hidden">
        <CebuMap
          leads={leads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          height="100%"
          viewMode={viewMode}
        />
      </div>

      {/* ── CENTERED DETAIL MODAL ───────────────────────────────── */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="relative w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                      {selectedLead.category}
                    </span>
                    {getStatusPill(selectedLead.websiteStatus)}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground leading-tight">{selectedLead.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {selectedLead.barangay}, {selectedLead.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-lg bg-card hover:bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Score + Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Opportunity Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-primary">{selectedLead.leadScore}</span>
                    <span className="text-xs text-muted-foreground font-semibold">/ 100</span>
                  </div>
                  {/* Score bar */}
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${selectedLead.leadScore}%` }}
                    />
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">GPS Coordinates</span>
                  <div className="text-xs text-muted-foreground font-mono space-y-0.5 mt-1">
                    <div>Lat: <span className="text-foreground">{selectedLead.lat.toFixed(5)}</span></div>
                    <div>Lng: <span className="text-foreground">{selectedLead.lng.toFixed(5)}</span></div>
                  </div>
                </div>
              </div>

              {/* Digital Audit */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Digital Audit Findings
                </h4>
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Primary Issue: </span>
                    <span className="text-red-400 font-bold">{selectedLead.primaryProblem}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Recommended Offer: </span>
                    <span className="text-primary font-bold">{selectedLead.recommendedOffer}</span>
                  </div>
                  {selectedLead.contactsCount > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground font-semibold">Contacts on File: </span>
                      <span className="text-emerald-400 font-bold">{selectedLead.contactsCount} contact(s)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-background flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedLead.facebookUrl && (
                  <a
                    href={selectedLead.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Facebook
                  </a>
                )}
                {selectedLead.websiteUrl && (
                  <a
                    href={selectedLead.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  setPitchModalLeadId(selectedLead.id)
                  setPitchModalLeadName(selectedLead.name)
                  setSelectedLead(null)
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-[#355448] text-foreground text-xs font-bold shadow-lg  flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                ✨ AI Pitch Studio
              </button>
            </div>
          </div>
        </div>
      )}

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
