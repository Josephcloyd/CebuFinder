'use client'

import { useCallback, useEffect, useState } from 'react'
import { Radar, Search, Building2, Loader2, CheckCircle2, AlertCircle, Plus, MapPin, Globe, RefreshCw } from 'lucide-react'
import { BUSINESS_CATEGORIES } from '../../../lib/constants/business-categories'
import { DISCOVERY_CITIES, DISCOVERY_CITY_BARANGAYS, type DiscoveryCity } from '../../../lib/constants/discovery-locations'
import { getErrorMessage } from '../../../lib/utils/errors'

type DiscoveryStatus = 'idle' | 'starting' | 'QUEUED' | 'SEARCHING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

interface DiscoveryScan {
  id: string
  category: string
  barangay: string | null
  city: string
  status: Exclude<DiscoveryStatus, 'idle' | 'starting'>
  message: string
  foundCount: number
  addedCount: number
  updatedCount: number
  skippedCount: number
  error: string | null
  createdAt: string
  completedAt: string | null
}

const ACTIVE_SCAN_STATUSES: DiscoveryStatus[] = ['starting', 'QUEUED', 'SEARCHING', 'PROCESSING']

function scanProgress(status: DiscoveryStatus) {
  return { idle: 0, starting: 8, QUEUED: 15, SEARCHING: 45, PROCESSING: 78, COMPLETED: 100, FAILED: 100 }[status]
}

export default function DiscoveryPage() {
  const [category, setCategory] = useState('')
  const [barangay, setBarangay] = useState('')
  const [city, setCity] = useState<DiscoveryCity>('Cebu City')
  const [status, setStatus] = useState<DiscoveryStatus>('idle')
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState('')
  const [recentJobs, setRecentJobs] = useState<DiscoveryScan[]>([])

  // Manual entry
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')
  const [manualName, setManualName] = useState('')
  const [manualCategory, setManualCategory] = useState('')
  const [manualBarangay, setManualBarangay] = useState('')
  const [manualCity, setManualCity] = useState<DiscoveryCity>('Cebu City')
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [manualEstablishedYear, setManualEstablishedYear] = useState('')
  const [isSavingManual, setIsSavingManual] = useState(false)
  const [manualSaved, setManualSaved] = useState(false)

  const loadRecentJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/discovery?limit=5', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.success) {
        const scans = data.scans as DiscoveryScan[]
        setRecentJobs(scans)

        const activeScan = scans.find((scan) => ACTIVE_SCAN_STATUSES.includes(scan.status))
        if (activeScan) {
          setJobId(activeScan.id)
          setStatus(activeScan.status)
          setMessage(activeScan.error || activeScan.message)
        }
      }
    } catch {
      // The primary status card still reports the active scan if history is unavailable.
    }
  }, [])

  useEffect(() => {
    void loadRecentJobs()
  }, [loadRecentJobs])

  useEffect(() => {
    if (!jobId || !ACTIVE_SCAN_STATUSES.includes(status)) return

    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/discovery/${jobId}`, { cache: 'no-store' })
        const data = await res.json()
        if (cancelled || !res.ok || !data.success) return

        const scan = data.scan as DiscoveryScan
        setStatus(scan.status)
        setMessage(scan.error || scan.message)
        setRecentJobs((current) => [scan, ...current.filter((item) => item.id !== scan.id)].slice(0, 5))
        if (scan.status === 'COMPLETED' || scan.status === 'FAILED') void loadRecentJobs()
      } catch {
        // Keep polling; a temporary network interruption does not mean the scan failed.
      }
    }

    void poll()
    const interval = window.setInterval(poll, 2000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [jobId, loadRecentJobs, status])

  const runDiscovery = async () => {
    if (!category) return
    setStatus('starting')
    setMessage('Starting the discovery scan…')

    try {
      const res = await fetch('/api/v1/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          barangay: barangay || undefined,
          city,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus(data.scan?.status || 'QUEUED')
        setMessage(data.message)
        setJobId(data.jobId)
        if (data.scan) setRecentJobs((prev) => [data.scan, ...prev.filter((item) => item.id !== data.scan.id)].slice(0, 5))
        window.dispatchEvent(new Event('discovery-scan-started'))
      } else {
        setStatus('FAILED')
        setMessage(data.error || 'Discovery failed')
      }
    } catch (err: unknown) {
      setStatus('FAILED')
      setMessage(getErrorMessage(err))
    }
  }

  const saveManual = async () => {
    if (!manualName || !manualCategory || !manualBarangay) return
    setIsSavingManual(true)
    try {
      const res = await fetch('/api/v1/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName,
          businessCategory: manualCategory,
          barangay: manualBarangay,
          city: manualCity,
          latitude: manualLat ? parseFloat(manualLat) : null,
          longitude: manualLng ? parseFloat(manualLng) : null,
          establishedYear: manualEstablishedYear ? Number(manualEstablishedYear) : null,
          discoverySource: 'MANUAL_ENTRY',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setManualSaved(true)
        setManualName(''); setManualCategory(''); setManualBarangay('')
        setManualLat(''); setManualLng(''); setManualEstablishedYear('')
        setTimeout(() => setManualSaved(false), 3000)
      }
    } finally {
      setIsSavingManual(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="mb-2 text-sm font-medium text-primary">Lead sourcing</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">Business discovery</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Search public map data for local businesses or add a verified record manually.</p>
      </div>

      {/* Tabs */}
      <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setActiveTab('auto')}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'auto' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Automated search
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'manual' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Manual entry
        </button>
      </div>

      {/* ── AUTO DISCOVERY ── */}
      {activeTab === 'auto' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {/* Config Card */}
            <div className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Configure search</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a category and area. OpenStreetMap does not require an API key.</p>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-medium text-foreground">
                  Business Category <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        category === cat
                          ? 'bg-primary/15 border-primary/50 text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">City</label>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value as DiscoveryCity)
                      setBarangay('')
                    }}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {DISCOVERY_CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Barangay</label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">All Barangays in {city}</option>
                    {DISCOVERY_CITY_BARANGAYS[city].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={runDiscovery}
                disabled={!category || ACTIVE_SCAN_STATUSES.includes(status)}
                className="btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ACTIVE_SCAN_STATUSES.includes(status) ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scan in progress…</>
                ) : (
                  <><Radar className="w-4 h-4" /> Start Discovery Scan</>
                )}
              </button>

              {/* Status Result */}
              {ACTIVE_SCAN_STATUSES.includes(status) && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4" role="status" aria-live="polite">
                  <div className="flex items-start gap-3">
                    <Loader2 className="mt-0.5 h-5 w-5 flex-shrink-0 animate-spin text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {status === 'PROCESSING' ? 'Saving results' : status === 'SEARCHING' ? 'Searching public listings' : 'Preparing scan'}
                        </p>
                        <span className="text-xs font-semibold text-primary">{scanProgress(status)}%</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${scanProgress(status)}%` }} />
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">You can leave this page—the scan continues in the background.</p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'COMPLETED' && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Scan complete</p>
                    <p className="mt-0.5 text-xs text-emerald-800/80">{message}</p>
                  </div>
                </div>
              )}

              {status === 'FAILED' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Discovery failed</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">What happens next</h3>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'OSM Overpass Query', desc: 'Searches OpenStreetMap for businesses matching your category in the selected area', icon: Globe, color: 'text-blue-400' },
                  { step: '2', label: 'Search Engine Fallback', desc: 'If OSM returns few results, falls back to Google/Bing Search API for broader coverage', icon: Search, color: 'text-primary' },
                  { step: '3', label: 'Digital Audit', desc: 'Each discovered business is automatically audited for website status, SSL, and mobile readiness', icon: Radar, color: 'text-primary' },
                  { step: '4', label: 'Lead Scoring', desc: 'AI assigns opportunity scores and generates recommended offers for each business', icon: Building2, color: 'text-amber-400' },
                ].map(({ step, label, desc, icon: Icon, color }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">{step}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-sm font-bold text-foreground">{label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recent Jobs */}
          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <RefreshCw className="w-3.5 h-3.5" /> Recent Scan Jobs
              </h3>
              {recentJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <Radar className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No scans run yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="p-3 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${job.status === 'COMPLETED' ? 'bg-emerald-500' : job.status === 'FAILED' ? 'bg-red-500' : 'bg-primary animate-pulse'}`} />
                        <span className="text-xs font-bold text-foreground">{job.category}</span>
                        <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{job.status.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" />
                        {job.barangay || 'All barangays'}, {job.city}
                      </div>
                      {job.status === 'COMPLETED' && (
                        <p className="mt-2 text-[10px] text-muted-foreground">{job.foundCount} found · {job.addedCount} added · {job.updatedCount} updated</p>
                      )}
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${job.status === 'FAILED' ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${scanProgress(job.status)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-[#f1eee7] p-5">
              <h4 className="text-xs font-semibold text-foreground">Data notes</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• Run scans per barangay for highest accuracy</li>
                <li>• Dental & Restaurant categories have best OSM coverage</li>
                <li>• The status indicator confirms when each scan is done</li>
                <li>• Duplicate businesses are automatically merged</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL ENTRY ── */}
      {activeTab === 'manual' && (
        <div className="max-w-xl space-y-5">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Add a business</h2>
              <p className="mt-1 text-sm text-muted-foreground">Create a lead that you have already verified.</p>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">Business Name *</label>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Jollibee Mabolo Branch"
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">Category *</label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">Select a business category</option>
                {BUSINESS_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">City</label>
              <select
                value={manualCity}
                onChange={(e) => {
                  setManualCity(e.target.value as DiscoveryCity)
                  setManualBarangay('')
                }}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                {DISCOVERY_CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">Barangay *</label>
              <select
                value={manualBarangay}
                onChange={(e) => setManualBarangay(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">Select a barangay in {manualCity}</option>
                {DISCOVERY_CITY_BARANGAYS[manualCity].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Latitude (optional)', value: manualLat, setter: setManualLat, placeholder: '10.3157' },
                { label: 'Longitude (optional)', value: manualLng, setter: setManualLng, placeholder: '123.8854' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">{label}</label>
                  <input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    type="number"
                    step="any"
                    className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">Year established (optional)</label>
              <input
                value={manualEstablishedYear}
                onChange={(e) => setManualEstablishedYear(e.target.value)}
                placeholder="e.g. 2018"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <p className="mt-1.5 text-[10px] text-muted-foreground">Use the year the business opened, not the year you discovered it.</p>
            </div>

            <button
              onClick={saveManual}
              disabled={!manualName || !manualCategory || !manualBarangay || isSavingManual}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                manualSaved
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-primary hover:bg-[#355448] text-foreground shadow-lg '
              }`}
            >
              {isSavingManual ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : manualSaved ? (
                <><CheckCircle2 className="w-4 h-4" /> Business Added!</>
              ) : (
                <><Plus className="w-4 h-4" /> Add Business</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
