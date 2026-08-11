'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building2, MapPin, Globe, ExternalLink, Phone, Mail, MessageSquare,
  ShieldAlert, Sparkles, CheckCircle2, AlertCircle, Clock, FileText, Send,
  Loader2, Save, ChevronRight, Calendar, Star, Wifi, WifiOff, Link2,
  ShoppingCart, Smartphone, Lock, Trash2,
} from 'lucide-react'
import { BusinessTimeline } from '../../../../components/business-timeline'
import { PitchGeneratorModal } from '../../../../components/pitch-generator-modal'

const CONTACT_ICONS: Record<string, any> = {
  BUSINESS_EMAIL: Mail,
  BUSINESS_PHONE: Phone,
  FACEBOOK_MESSENGER: Link2,
  WHATSAPP: MessageSquare,
  VIBER: MessageSquare,
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  FULLY_FUNCTIONAL: { label: '🟢 Functional Website', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Wifi },
  FACEBOOK_ONLY: { label: '🟡 Facebook Only', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Link2 },
  OUTDATED_SITE: { label: '🟡 Outdated Site', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  NO_WEBSITE: { label: '🔴 No Website', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: WifiOff },
  BROKEN_SITE: { label: '🔴 Broken Site', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: WifiOff },
  PARKED_DOMAIN: { label: '🔴 Parked Domain', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: WifiOff },
}

const OUTREACH_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFTED: { label: 'Drafted', color: 'text-zinc-400' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-amber-400' },
  APPROVED: { label: 'Approved', color: 'text-blue-400' },
  SENT: { label: 'Sent ✓', color: 'text-emerald-400' },
  REPLIED: { label: 'Replied! 🎉', color: 'text-green-400' },
  FAILED: { label: 'Failed', color: 'text-red-400' },
  REJECTED: { label: 'Rejected', color: 'text-red-400' },
  OPTED_OUT: { label: 'Opted Out', color: 'text-zinc-500' },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [business, setBusiness] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'outreach' | 'timeline'>('overview')
  const [pitchOpen, setPitchOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/v1/leads/${id}`)
        const data = await res.json()
        if (data.success) {
          setBusiness(data.business)
          setNotes(data.business.notes ?? '')
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  const saveNotes = useCallback(async () => {
    setIsSavingNotes(true)
    try {
      await fetch(`/api/v1/leads/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2500)
    } finally {
      setIsSavingNotes(false)
    }
  }, [id, notes])

  const handleDeleteBusiness = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/v1/leads/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        router.push('/leads')
      } else {
        alert(`Error deleting business: ${data.error}`)
        setIsDeleting(false)
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-zinc-500 text-sm font-semibold">Loading business profile...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-zinc-400 font-semibold">Business not found</p>
          <Link href="/leads" className="text-purple-400 text-sm hover:underline">← Back to Leads</Link>
        </div>
      </div>
    )
  }

  const dp = business.digitalPresence
  const oa = business.opportunityAnalysis
  const statusCfg = STATUS_CONFIG[dp?.websiteStatus || 'NO_WEBSITE'] || STATUS_CONFIG.NO_WEBSITE

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Back navigation ── */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/leads" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Priority Leads
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
        <span className="text-zinc-300 font-semibold truncate max-w-xs">{business.name}</span>
      </div>

      {/* ── Hero Header Card ── */}
      <div className="p-6 rounded-2xl glass-card border border-zinc-800/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                  {business.businessCategory}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">{business.name}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-zinc-400 text-sm">
                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                <span>{business.barangay}, {business.city}, {business.province}</span>
              </div>
              {business.description && (
                <p className="mt-2 text-sm text-zinc-400 max-w-xl">{business.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {oa && (
              <div className="text-center px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="text-3xl font-black text-purple-400">{oa.leadScore}</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Lead Score</div>
              </div>
            )}
            <button
              onClick={() => setPitchOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              AI Pitch Studio
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete this business"
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Score bar */}
        {oa && (
          <div className="relative mt-4 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
              style={{ width: `${oa.leadScore}%`, transition: 'width 0.8s ease' }}
            />
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-fit">
        {(['overview', 'outreach', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'overview' ? '📋 Overview' : tab === 'outreach' ? '✉️ Outreach' : '📅 Timeline'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left col: audit + opportunity */}
          <div className="lg:col-span-2 space-y-5">
            {/* Digital Presence */}
            {dp && (
              <div className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Digital Presence Audit
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Website', value: dp.websiteUrl ? dp.websiteUrl : 'None', icon: Globe, link: dp.websiteUrl },
                    { label: 'SSL Certificate', value: dp.hasSsl ? 'Yes ✓' : 'No ✗', icon: Lock, color: dp.hasSsl ? 'text-emerald-400' : 'text-red-400' },
                    { label: 'Mobile Ready', value: dp.isMobileResponsive ? 'Yes ✓' : 'No ✗', icon: Smartphone, color: dp.isMobileResponsive ? 'text-emerald-400' : 'text-red-400' },
                    { label: 'Online Booking', value: dp.hasOnlineBooking ? 'Yes ✓' : 'No ✗', icon: Calendar, color: dp.hasOnlineBooking ? 'text-emerald-400' : 'text-zinc-500' },
                    { label: 'E-Commerce', value: dp.hasEcommerce ? 'Yes ✓' : 'No ✗', icon: ShoppingCart, color: dp.hasEcommerce ? 'text-emerald-400' : 'text-zinc-500' },
                    { label: 'Facebook', value: dp.facebookUrl ? 'Present' : 'None', icon: Link2, link: dp.facebookUrl, color: dp.facebookUrl ? 'text-blue-400' : 'text-zinc-500' },
                  ].map(({ label, value, icon: Icon, link, color }) => (
                    <div key={label} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                      </div>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 truncate">
                          <span className="truncate">{value}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className={`text-xs font-semibold ${color || 'text-zinc-300'}`}>{value}</span>
                      )}
                    </div>
                  ))}
                </div>
                {dp.instagramUrl && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Globe className="w-3.5 h-3.5 text-pink-400" />
                    <a href={dp.instagramUrl} target="_blank" rel="noreferrer" className="hover:underline text-pink-400">{dp.instagramUrl}</a>
                  </div>
                )}
              </div>
            )}

            {/* Opportunity Analysis */}
            {oa && (
              <div className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Opportunity Analysis
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Primary Problem</div>
                    <div className="text-red-400 font-semibold">{oa.primaryProblem}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Recommended Offer</div>
                    <div className="text-purple-300 font-semibold">{oa.recommendedOffer}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Opportunity Summary</div>
                    <div className="text-zinc-300 text-xs leading-relaxed">{oa.opportunitySummary}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Private Notes
                </h3>
                <button
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    notesSaved
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : notesSaved ? (
                    <><CheckCircle2 className="w-3 h-3" /> Saved!</>
                  ) : (
                    <><Save className="w-3 h-3" /> Save Notes</>
                  )}
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNotes() } }}
                placeholder="Add private notes about this business... (Ctrl+S to save)"
                rows={5}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-purple-500/40 transition-colors leading-relaxed"
              />
              <p className="text-[10px] text-zinc-600">Tip: Press Ctrl+S to save quickly</p>
            </div>
          </div>

          {/* Right col: contacts + meta */}
          <div className="space-y-5">
            {/* Contacts */}
            <div className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Contacts ({business.contacts.length})
              </h3>
              {business.contacts.length === 0 ? (
                <div className="py-6 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No contacts on file</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Add contact info to enable outreach</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {business.contacts.map((c: any) => {
                    const Icon = CONTACT_ICONS[c.contactType] || Mail
                    return (
                      <div key={c.id} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{c.contactType.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-zinc-200 font-semibold truncate">{c.contactValue}</div>
                        </div>
                        {c.doNotContact && (
                          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">DNC</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Business Meta */}
            <div className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Star className="w-3.5 h-3.5" /> Business Details
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Discovery Source', value: business.discoverySource?.replace(/_/g, ' ') || '—' },
                  { label: 'Date Discovered', value: formatDate(business.dateDiscovered) },
                  { label: 'Last Checked', value: formatDate(business.dateLastChecked) },
                  { label: 'Province', value: business.province },
                  ...(business.latitude ? [{ label: 'GPS', value: `${Number(business.latitude).toFixed(4)}, ${Number(business.longitude).toFixed(4)}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500 font-semibold">{label}</span>
                    <span className="text-zinc-300 font-semibold text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OUTREACH TAB ── */}
      {activeTab === 'outreach' && (
        <div className="space-y-3">
          {business.outreach.length === 0 ? (
            <div className="p-12 rounded-2xl glass-card border border-zinc-800/60 text-center">
              <Send className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-semibold text-sm">No outreach messages yet</p>
              <p className="text-zinc-600 text-xs mt-1 mb-4">Generate a pitch with AI Pitch Studio to get started</p>
              <button
                onClick={() => setPitchOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Open AI Pitch Studio
              </button>
            </div>
          ) : (
            business.outreach.map((o: any) => {
              const statusCfg = OUTREACH_STATUS_CONFIG[o.status] || { label: o.status, color: 'text-zinc-400' }
              return (
                <div key={o.id} className="p-5 rounded-2xl glass-card border border-zinc-800/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                        <span className="text-[10px] text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{o.channel}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{o.subject}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {o.sentAt ? `Sent ${formatDate(o.sentAt)}` : `Created ${formatDate(o.createdAt)}`}
                      </p>
                    </div>
                    {o.contact && (
                      <div className="text-right text-[10px] text-zinc-500">
                        <div className="font-bold text-zinc-400">{o.contact.contactType.replace(/_/g, ' ')}</div>
                        <div>{o.contact.contactValue}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 text-xs text-zinc-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {o.messageBody}
                  </div>
                  {o.followups.length > 0 && (
                    <div className="text-[10px] text-zinc-500 font-semibold">
                      {o.followups.length} follow-up(s) scheduled
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === 'timeline' && (
        <div className="p-5 rounded-2xl glass-card border border-zinc-800/60">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Activity Timeline
          </h3>
          <BusinessTimeline businessId={id} />
        </div>
      )}

      {/* Pitch Generator Modal */}
      <PitchGeneratorModal
        isOpen={pitchOpen}
        onClose={() => setPitchOpen(false)}
        businessId={id}
        businessName={business.name}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-red-500/20 rounded-2xl shadow-2xl p-6 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Delete Business?</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">{business.name}</strong>?
                This will delete all associated audit data, contacts, opportunity analyses, and outreach records.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBusiness}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
