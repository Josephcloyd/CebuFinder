'use client'

import { useState } from 'react'
import { Radar, Search, Building2, Loader2, CheckCircle2, AlertCircle, Plus, MapPin, Globe, RefreshCw } from 'lucide-react'
import { BUSINESS_CATEGORIES } from '../../../lib/constants/business-categories'
import { DISCOVERY_CITIES, DISCOVERY_CITY_BARANGAYS, type DiscoveryCity } from '../../../lib/constants/discovery-locations'
import { getErrorMessage } from '../../../lib/utils/errors'

type DiscoveryStatus = 'idle' | 'running' | 'success' | 'error'

export default function DiscoveryPage() {
  const [category, setCategory] = useState('')
  const [barangay, setBarangay] = useState('')
  const [city, setCity] = useState<DiscoveryCity>('Cebu City')
  const [status, setStatus] = useState<DiscoveryStatus>('idle')
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState('')
  const [recentJobs, setRecentJobs] = useState<{ category: string; barangay: string; city: string; status: string; ts: string }[]>([])

  // Manual entry
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')
  const [manualName, setManualName] = useState('')
  const [manualCategory, setManualCategory] = useState('')
  const [manualBarangay, setManualBarangay] = useState('')
  const [manualCity, setManualCity] = useState<DiscoveryCity>('Cebu City')
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [isSavingManual, setIsSavingManual] = useState(false)
  const [manualSaved, setManualSaved] = useState(false)

  const runDiscovery = async () => {
    if (!category) return
    setStatus('running')
    setMessage('')

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
      if (data.success) {
        setStatus('success')
        setMessage(data.message)
        setJobId(data.jobId)
        setRecentJobs((prev) => [
          { category, barangay: barangay || `All Barangays in ${city}`, city, status: 'running', ts: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4),
        ])
      } else {
        setStatus('error')
        setMessage(data.error || 'Discovery failed')
      }
    } catch (err: unknown) {
      setStatus('error')
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
          discoverySource: 'MANUAL_ENTRY',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setManualSaved(true)
        setManualName(''); setManualCategory(''); setManualBarangay('')
        setManualLat(''); setManualLng('')
        setTimeout(() => setManualSaved(false), 3000)
      }
    } finally {
      setIsSavingManual(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Radar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black gradient-text">Discovery Automation</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Auto-scan Cebu businesses from OSM + Search engines, or add manually</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('auto')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'auto' ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          🤖 Auto Discovery
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'manual' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {/* ── AUTO DISCOVERY ── */}
      {activeTab === 'auto' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Config Card */}
            <div className="p-6 rounded-2xl glass-card border border-zinc-800/60 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" /> Configure Discovery Scan
              </h3>

              {/* Category */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
                  Business Category <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        category === cat
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">City</label>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value as DiscoveryCity)
                      setBarangay('')
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {DISCOVERY_CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">Barangay</label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">All Barangays in {city}</option>
                    {DISCOVERY_CITY_BARANGAYS[city].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={runDiscovery}
                disabled={!category || status === 'running'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'running' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Cebu...</>
                ) : (
                  <><Radar className="w-4 h-4" /> Start Discovery Scan</>
                )}
              </button>

              {/* Status Result */}
              {status === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Discovery Triggered!</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{message}</p>
                    {jobId && <p className="text-[10px] text-zinc-600 mt-1 font-mono">Job ID: {jobId}</p>}
                    <p className="text-xs text-zinc-400 mt-2">New businesses will appear in your Leads list in 30–60 seconds. Click Refresh on the Leads page.</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400">Discovery Failed</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="p-5 rounded-2xl glass-card border border-zinc-800/60">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">How Auto Discovery Works</h3>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'OSM Overpass Query', desc: 'Searches OpenStreetMap for businesses matching your category in the selected area', icon: Globe, color: 'text-blue-400' },
                  { step: '2', label: 'Search Engine Fallback', desc: 'If OSM returns few results, falls back to Google/Bing Search API for broader coverage', icon: Search, color: 'text-purple-400' },
                  { step: '3', label: 'Digital Audit', desc: 'Each discovered business is automatically audited for website status, SSL, and mobile readiness', icon: Radar, color: 'text-cyan-400' },
                  { step: '4', label: 'Lead Scoring', desc: 'AI assigns opportunity scores and generates recommended offers for each business', icon: Building2, color: 'text-amber-400' },
                ].map(({ step, label, desc, icon: Icon, color }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 flex-shrink-0">{step}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-sm font-bold text-white">{label}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recent Jobs */}
          <div className="space-y-5">
            <div className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Recent Scan Jobs
              </h3>
              {recentJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <Radar className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">No scans run yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentJobs.map((job, i) => (
                    <div key={i} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">{job.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
                        <MapPin className="w-2.5 h-2.5" />
                        {job.barangay}, {job.city}
                        <span className="ml-auto">{job.ts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 space-y-2">
              <h4 className="text-xs font-black text-cyan-400">💡 Pro Tips</h4>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• Run scans per barangay for highest accuracy</li>
                <li>• Dental & Restaurant categories have best OSM coverage</li>
                <li>• Check Leads page after 60s for new discoveries</li>
                <li>• Duplicate businesses are automatically merged</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL ENTRY ── */}
      {activeTab === 'manual' && (
        <div className="max-w-xl space-y-5">
          <div className="p-6 rounded-2xl glass-card border border-zinc-800/60 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" /> Add Business Manually
            </h3>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">Business Name *</label>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Jollibee Mabolo Branch"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">Category *</label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/40"
              >
                <option value="">Select a business category</option>
                {BUSINESS_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">City</label>
              <select
                value={manualCity}
                onChange={(e) => {
                  setManualCity(e.target.value as DiscoveryCity)
                  setManualBarangay('')
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/40"
              >
                {DISCOVERY_CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">Barangay *</label>
              <select
                value={manualBarangay}
                onChange={(e) => setManualBarangay(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/40"
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">{label}</label>
                  <input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    type="number"
                    step="any"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={saveManual}
              disabled={!manualName || !manualCategory || !manualBarangay || isSavingManual}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                manualSaved
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
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
