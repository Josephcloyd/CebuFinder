'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Mail, Phone, HeartCrack, ChevronRight, X, Building2, MapPin, Sparkles, Copy, ExternalLink, Send, MessageSquare, Smartphone, Check, RefreshCw, Star, TrendingUp, Calendar, Zap, Plus, ShieldCheck, AlertCircle, Trash2, Sparkle } from 'lucide-react'
import { PitchGeneratorModal } from './pitch-generator-modal'

interface LeadTableProps {
  leads: Array<{
    id: string
    name: string
    businessCategory: string
    barangay: string
    city?: string
    dateDiscovered: string
    facebookUrl?: string
    digitalPresence?: {
      websiteStatus: string
      websiteUrl?: string
      hasSsl?: boolean
      isMobileResponsive?: boolean
    }
    opportunityAnalysis?: {
      leadScore: number
      primaryProblem?: string
      recommendedService?: string
      opportunitySummary?: string
      recommendedOffer?: string
    }
    contacts: Array<{
      contactType: string
      contactValue: string
    }>
  }>
}

export function LeadTable({ leads: initialLeads }: LeadTableProps) {
  const [mounted, setMounted] = useState(false)
  const [leadsList, setLeadsList] = useState<any[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [pitchModalLeadId, setPitchModalLeadId] = useState<string | null>(null)
  const [pitchModalLeadName, setPitchModalLeadName] = useState<string>('')

  // Modal active tab
  const [modalTab, setModalTab] = useState<'profile' | 'outreach'>('profile')

  // Inline Contact Add State
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContactType, setNewContactType] = useState<'BUSINESS_EMAIL' | 'BUSINESS_PHONE'>('BUSINESS_EMAIL')
  const [newContactValue, setNewContactValue] = useState('')
  const [contactAddStatus, setContactAddStatus] = useState<string | null>(null)

  // Outreach Assistant State
  const [offerType, setOfferType] = useState<'WEB_IMPROVEMENT' | 'SYSTEM_CREATION'>('WEB_IMPROVEMENT')
  const [outreachChannel, setOutreachChannel] = useState<'EMAIL' | 'SMS'>('EMAIL')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [isSendingOutreach, setIsSendingOutreach] = useState(false)
  const [outreachResult, setOutreachResult] = useState<string | null>(null)
  // Deduplication & Delete State
  const [isDeduplicating, setIsDeduplicating] = useState(false)
  const [dedupStatus, setDedupStatus] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setLeadsList(initialLeads)
  }, [initialLeads])

  // Body scroll lock & ESC key listener for modal
  useEffect(() => {
    if (selectedLead) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedLead(null)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [selectedLead])

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Multi-factor Lead Scoring calculation
  const getLeadScoreDetails = (lead: any) => {
    const webStatus = lead?.digitalPresence?.websiteStatus || 'NO_WEBSITE'
    const hasContacts = lead?.contacts && lead.contacts.length > 0
    const cat = (lead?.businessCategory || '').toLowerCase()

    let digitalNeedScore = 25
    if (webStatus === 'NO_WEBSITE' || webStatus === 'FACEBOOK_ONLY') digitalNeedScore = 40
    else if (webStatus === 'BROKEN_SITE' || webStatus === 'PARKED_DOMAIN') digitalNeedScore = 35

    let reachabilityScore = hasContacts ? 30 : 10

    let categoryScore = 15
    if (cat.includes('clinic') || cat.includes('medical') || cat.includes('dental') || cat.includes('law') || cat.includes('construction')) {
      categoryScore = 20
    }

    let activityScore = 10

    const total = Math.min(100, digitalNeedScore + reachabilityScore + categoryScore + activityScore)

    // Override if existing DB lead score exists and is valid
    const finalScore = (lead?.opportunityAnalysis?.leadScore && lead.opportunityAnalysis.leadScore > 0)
      ? lead.opportunityAnalysis.leadScore
      : total

    return {
      total: finalScore,
      digitalNeedScore,
      reachabilityScore,
      categoryScore,
      activityScore,
    }
  }

  const getRecommendedServiceLabel = (serviceKey?: string, category: string = ''): string => {
    if (serviceKey && !serviceKey.startsWith('NEXTJS_') && !serviceKey.startsWith('HEURISTIC_')) {
      return serviceKey.replace(/_/g, ' ')
    }
    const cat = category.toLowerCase()
    if (cat.includes('clinic') || cat.includes('medical') || cat.includes('dental') || cat.includes('veterinary')) {
      return 'Clinic Automated Appointment & Patient Portal'
    } else if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('coffee')) {
      return 'Digital Menu & Table Reservation System'
    } else if (cat.includes('salon') || cat.includes('barber') || cat.includes('gym') || cat.includes('fitness') || cat.includes('massage') || cat.includes('spa')) {
      return 'Service Booking & Client Membership Portal'
    } else if (cat.includes('auto repair')) {
      return 'Auto Service Booking & Customer Portal'
    } else if (cat.includes('hardware')) {
      return 'Inventory, Quote & Order Management System'
    } else if (cat.includes('accounting') || cat.includes('law office')) {
      return 'Professional Services Client Portal'
    }
    return 'High-Converting Next.js Web App & SEO Package'
  }

  const updateTemplate = (type: 'WEB_IMPROVEMENT' | 'SYSTEM_CREATION', lead: any) => {
    setOfferType(type)
    setOutreachResult(null)
    const hasWeb = lead?.digitalPresence?.websiteUrl

    if (type === 'WEB_IMPROVEMENT') {
      setCustomSubject(`Website Upgrade & Digital System Proposal for ${lead?.name}`)
      setCustomBody(
        `Hi ${lead?.name} Team,\n\nI noticed your business in Barangay ${lead?.barangay}, ${lead?.city || 'Cebu City'} ${hasWeb ? 'currently has a website that could benefit from a modern Next.js performance upgrade' : 'does not have an active website online yet'}.\n\nWe build custom modern web applications, high-converting landing pages, and online booking portals for local businesses to boost search visibility and client inquiries.\n\nWould you be open to a quick 5-minute preview of a custom website design created specifically for ${lead?.name}?\n\nBest regards,\nCebu Digital Engineering Team`
      )
    } else {
      setCustomSubject(`Custom Management System & Booking Portal for ${lead?.name}`)
      setCustomBody(
        `Hi ${lead?.name} Team,\n\nWe build custom management software, automated appointment booking systems, and client CRM portals tailored for ${lead?.businessCategory}s in ${lead?.city || 'Cebu City'}.\n\nWe would love to build an automated digital booking & client management system for ${lead?.name} to streamline your operations and double your customer conversions.\n\nAre you available for a brief chat this week to review a live demo?\n\nBest regards,\nCebu Digital Engineering Team`
      )
    }
  }

  useEffect(() => {
    if (selectedLead) {
      setModalTab('profile')
      setOutreachResult(null)
      setIsAddingContact(false)
      setContactAddStatus(null)
      setNewContactValue('')

      const hasEmail = selectedLead.contacts?.some((c: any) => c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@'))
      const hasPhone = selectedLead.contacts?.some((c: any) => c.contactType === 'BUSINESS_PHONE' || c.contactType === 'PHONE' || !c.contactValue.includes('@'))

      if (hasEmail) {
        setOutreachChannel('EMAIL')
      } else if (hasPhone) {
        setOutreachChannel('SMS')
      }

    }
  }, [selectedLead])

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to delete "${leadName}" and all associated data?`)) return
    setDeletingId(leadId)
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setLeadsList((prev) => prev.filter((l) => l.id !== leadId))
        if (selectedLead?.id === leadId) setSelectedLead(null)
      } else {
        alert(`Failed to delete: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Error deleting business: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleAutoDeduplicate = async () => {
    setIsDeduplicating(true)
    setDedupStatus('Scanning for repeating duplicates...')
    try {
      const res = await fetch('/api/v1/leads/deduplicate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setDedupStatus(data.message)
        if (data.deletedCount > 0) {
          // Refresh leads list from server
          const refreshed = await fetch('/api/v1/leads').then((r) => r.json())
          if (refreshed.success) setLeadsList(refreshed.leads)
        }
        setTimeout(() => setDedupStatus(null), 4000)
      } else {
        setDedupStatus(`✕ ${data.error}`)
      }
    } catch (err: any) {
      setDedupStatus(`✕ ${err.message}`)
    } finally {
      setIsDeduplicating(false)
    }
  }

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newContactValue.trim()) return

    setContactAddStatus('Adding contact...')
    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedLead.id,
          contactType: newContactType,
          contactValue: newContactValue.trim(),
        })
      })

      const data = await response.json()
      if (data.success) {
        setContactAddStatus('✓ Contact saved! Lead is now prioritized.')
        const updatedContact = data.contact || { contactType: newContactType, contactValue: newContactValue.trim() }
        
        const updatedLead = {
          ...selectedLead,
          contacts: [...(selectedLead.contacts || []), updatedContact]
        }
        setSelectedLead(updatedLead)
        setLeadsList(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l))
        
        setNewContactValue('')
        setIsAddingContact(false)
        setTimeout(() => setContactAddStatus(null), 2500)
      } else {
        setContactAddStatus(`✕ ${data.error}`)
      }
    } catch (err: any) {
      setContactAddStatus(`✕ Error: ${err.message}`)
    }
  }

  const handleSendDirectOutreach = async () => {
    if (!selectedLead) return
    setIsSendingOutreach(true)
    setOutreachResult(null)

    const targetContact = selectedLead.contacts?.find((c: any) => 
      outreachChannel === 'EMAIL' 
        ? (c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@')) 
        : (c.contactType === 'BUSINESS_PHONE' || c.contactType === 'PHONE' || !c.contactValue.includes('@'))
    )

    const contactVal = targetContact?.contactValue || (outreachChannel === 'EMAIL' ? 'info@cebudigital.com' : '09170000000')

    try {
      const response = await fetch('/api/v1/outreach/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedLead.id,
          contactType: outreachChannel === 'EMAIL' ? 'BUSINESS_EMAIL' : 'BUSINESS_PHONE',
          contactValue: contactVal,
          subject: customSubject,
          messageBody: customBody,
        })
      })

      const data = await response.json()
      if (data.success) {
        setOutreachResult(`✓ ${data.message}`)
      } else {
        setOutreachResult(`✕ ${data.error}`)
      }
    } catch (err: any) {
      setOutreachResult(`✕ Connection error: ${err.message}`)
    } finally {
      setIsSendingOutreach(false)
    }
  }

  const getWhatsAppLink = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const formattedPhone = cleanPhone.startsWith('0') ? '63' + cleanPhone.substring(1) : cleanPhone
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'NO_WEBSITE':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'FACEBOOK_ONLY':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'OUTDATED_SITE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'BROKEN_SITE':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      default:
        return 'text-green-400 bg-green-500/10 border-green-500/20'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 80) return 'text-purple-400'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-zinc-400'
  }

  const getScoreBar = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-r from-emerald-500 to-green-400'
    if (score >= 80) return 'bg-gradient-to-r from-purple-500 to-indigo-400'
    if (score >= 70) return 'bg-gradient-to-r from-blue-500 to-cyan-400'
    if (score >= 50) return 'bg-gradient-to-r from-amber-500 to-yellow-400'
    return 'bg-purple-500'
  }

  const modalJSX = selectedLead ? (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setSelectedLead(null) }}
    >
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/10 relative animate-scale-in my-auto">
        
        {/* Modal Header with gradient top accent */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-zinc-800/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-indigo-600/10 to-transparent pointer-events-none" />
          <div className="p-6 pb-5 relative">
            {/* Close button */}
            <button 
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60 transition-all cursor-pointer"
              title="Close Modal (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/25 shrink-0">
                {selectedLead.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white">{selectedLead.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                    {selectedLead.businessCategory}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    Barangay {selectedLead.barangay}, {selectedLead.city || 'Cebu City'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800/50 mb-6 pb-3">
            <button
              onClick={() => setModalTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                modalTab === 'profile'
                  ? 'bg-zinc-800/90 text-white border border-zinc-700/60 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-purple-400" />
              Profile & Audit Summary
            </button>
            <button
              onClick={() => setModalTab('outreach')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                modalTab === 'outreach'
                  ? 'btn-primary text-white shadow-lg'
                  : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Outreach Assistant
            </button>
            <button
              onClick={() => {
                setPitchModalLeadId(selectedLead.id)
                setPitchModalLeadName(selectedLead.name)
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              AI Pitch Studio
            </button>
          </div>

          {/* TAB 1: PROFILE OVERVIEW */}
          {modalTab === 'profile' && (
            <>
              {/* Key Metrics Grid */}
              {(() => {
                const scoreDetails = getLeadScoreDetails(selectedLead)
                return (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Opportunity Score</div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className={`text-3xl font-black ${getScoreColor(scoreDetails.total)}`}>
                          {scoreDetails.total}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold">/ 100</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800/80 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${getScoreBar(scoreDetails.total)}`} 
                          style={{ width: `${scoreDetails.total}%` }} 
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Web Presence</div>
                      <div className="mt-2">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${getStatusBadge(selectedLead.digitalPresence?.websiteStatus)}`}>
                          {selectedLead.digitalPresence?.websiteStatus?.replace(/_/g, ' ') || 'UNAUDITED'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Discovery Date</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-zinc-200">
                          {selectedLead.dateDiscovered ? new Date(selectedLead.dateDiscovered).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Score Breakdown Factors */}
              {(() => {
                const scoreDetails = getLeadScoreDetails(selectedLead)
                return (
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 mb-6">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Opportunity Score Breakdown
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-zinc-400">Digital Need Impact:</span>
                        <span className="font-bold text-purple-400">+{scoreDetails.digitalNeedScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-zinc-400">Reachability Score:</span>
                        <span className="font-bold text-blue-400">+{scoreDetails.reachabilityScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-zinc-400">Category Value Margin:</span>
                        <span className="font-bold text-emerald-400">+{scoreDetails.categoryScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
                        <span className="text-zinc-400">Operating Signal:</span>
                        <span className="font-bold text-amber-400">+{scoreDetails.activityScore} pts</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Recommended Service */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border border-purple-500/15 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="text-xs font-bold uppercase text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Recommended Growth Package
                </div>
                <p className="text-sm text-zinc-100 mt-1.5 font-bold">
                  {getRecommendedServiceLabel(selectedLead.opportunityAnalysis?.recommendedService, selectedLead.businessCategory)}
                </p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {selectedLead.opportunityAnalysis?.opportunitySummary || `Strategic opportunity to launch automated client acquisition systems for ${selectedLead.name}.`}
                </p>
              </div>

              {/* Contacts List with Add Contact Button */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" /> Contact Channels
                  </h4>
                  <button
                    onClick={() => setIsAddingContact(!isAddingContact)}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingContact ? 'Cancel' : 'Add Contact'}
                  </button>
                </div>

                {/* Inline Contact Add Form */}
                {isAddingContact && (
                  <form onSubmit={handleAddContactSubmit} className="p-3.5 rounded-xl bg-zinc-900/80 border border-purple-500/30 space-y-3 animate-fade-in">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-purple-400" /> Attach Contact Channel
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newContactType}
                        onChange={(e) => setNewContactType(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
                      >
                        <option value="BUSINESS_EMAIL">Email</option>
                        <option value="BUSINESS_PHONE">Phone / Text</option>
                      </select>
                      <input
                        type="text"
                        placeholder={newContactType === 'BUSINESS_EMAIL' ? 'e.g. info@clinic.com' : 'e.g. 09171234567'}
                        value={newContactValue}
                        onChange={(e) => setNewContactValue(e.target.value)}
                        className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full btn-primary text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Contact to Lead Profile
                    </button>
                  </form>
                )}

                {contactAddStatus && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold ${contactAddStatus.startsWith('✓') ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {contactAddStatus}
                  </div>
                )}

                {selectedLead.contacts && selectedLead.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLead.contacts.map((c: any, idx: number) => {
                      const isEmail = c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@')
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 text-sm group/contact hover:border-zinc-700/50 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEmail ? 'bg-purple-500/10 border border-purple-500/15' : 'bg-blue-500/10 border border-blue-500/15'}`}>
                              {isEmail ? <Mail className="w-4 h-4 text-purple-400" /> : <Phone className="w-4 h-4 text-blue-400" />}
                            </div>
                            <div>
                              <span className="text-zinc-200 font-mono text-xs">{c.contactValue}</span>
                              <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                                {isEmail ? 'Business Email' : 'Business Phone / Mobile'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {!isEmail && (
                              <a
                                href={getWhatsAppLink(c.contactValue, `Hi ${selectedLead.name}, we build custom websites and booking portals for local businesses.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all"
                                title="Message via WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleCopy(c.contactValue, `contact-${idx}`)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                              {copiedField === `contact-${idx}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedField === `contact-${idx}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>No contact details attached yet.</span>
                    </div>
                    <button
                      onClick={() => setIsAddingContact(true)}
                      className="text-[11px] font-bold text-purple-400 underline cursor-pointer"
                    >
                      + Add One Now
                    </button>
                  </div>
                )}
              </div>

              {/* Digital Footprint / Web Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" /> Digital Footprint
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.digitalPresence?.websiteUrl ? (
                    <a
                      href={selectedLead.digitalPresence.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/15 hover:border-purple-500/25 text-purple-400 text-xs font-semibold transition-all"
                    >
                      <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-500 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                      <HeartCrack className="w-3.5 h-3.5 text-zinc-600" /> No Website Detected
                    </span>
                  )}
                  {selectedLead.facebookUrl && (
                    <a
                      href={selectedLead.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/15 hover:border-blue-500/25 text-blue-400 text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> Facebook Page
                    </a>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: OUTREACH ASSISTANT */}
          {modalTab === 'outreach' && (
            <div className="space-y-6">
              {/* Step 1: Offer Type Selector */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-black">1</span>
                  Service Offer Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateTemplate('WEB_IMPROVEMENT', selectedLead)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      offerType === 'WEB_IMPROVEMENT'
                        ? 'bg-purple-500/15 border-purple-500/30 text-white shadow-md shadow-purple-500/5'
                        : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Globe className="w-4 h-4 text-purple-400" /> Website Improvement
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">Modern web app, redesign & SEO upgrade.</p>
                  </button>
                  <button
                    onClick={() => updateTemplate('SYSTEM_CREATION', selectedLead)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      offerType === 'SYSTEM_CREATION'
                        ? 'bg-purple-500/15 border-purple-500/30 text-white shadow-md shadow-purple-500/5'
                        : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-purple-400" /> Custom System & Portal
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">Booking system, management software & CRM.</p>
                  </button>
                </div>
              </div>

              {/* Step 2: Channel Selector */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-black">2</span>
                  Communication Channel
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOutreachChannel('EMAIL')}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      outreachChannel === 'EMAIL'
                        ? 'btn-primary text-white shadow-lg'
                        : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email Proposal
                  </button>
                  <button
                    onClick={() => setOutreachChannel('SMS')}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      outreachChannel === 'SMS'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Text / WhatsApp
                  </button>
                </div>
              </div>

              {/* Step 3: Message Content */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-black">3</span>
                  Compose Message
                </label>
                <div className="space-y-3 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                  {outreachChannel === 'EMAIL' && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Email Subject</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                      {outreachChannel === 'EMAIL' ? 'Email Body' : 'Text / SMS Content'}
                    </label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      rows={7}
                      className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 leading-relaxed font-sans transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback status */}
              {outreachResult && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${outreachResult.startsWith('✓') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {outreachResult.startsWith('✓') ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {outreachResult}
                </div>
              )}

              {/* Step 4: Dispatch Actions */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-black">4</span>
                  Send or Copy
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopy(customBody, 'outreach-body')}
                    className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 hover:text-white hover:border-zinc-700/50 cursor-pointer transition-all"
                  >
                    {copiedField === 'outreach-body' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'outreach-body' ? 'Copied!' : 'Copy Text'}
                  </button>

                  {outreachChannel === 'EMAIL' ? (
                    <>
                      <a
                        href={`mailto:${selectedLead.contacts?.find((c: any) => c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@'))?.contactValue || ''}?subject=${encodeURIComponent(customSubject)}&body=${encodeURIComponent(customBody)}`}
                        className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-purple-400 hover:text-purple-300 hover:border-purple-500/20 cursor-pointer transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in Mail App
                      </a>

                      <button
                        onClick={handleSendDirectOutreach}
                        disabled={isSendingOutreach}
                        className="flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-xl btn-primary text-white font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOutreach ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isSendingOutreach ? 'Sending...' : 'Send Email Now'}
                      </button>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const phone = selectedLead.contacts?.find((c: any) => c.contactType === 'BUSINESS_PHONE' || c.contactType === 'PHONE' || !c.contactValue.includes('@'))?.contactValue
                        return phone ? (
                          <a
                            href={getWhatsAppLink(phone, customBody)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold transition-all cursor-pointer shadow-lg shadow-green-500/15 hover:shadow-green-500/25"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Open WhatsApp
                          </a>
                        ) : null
                      })()}

                      <button
                        onClick={handleSendDirectOutreach}
                        disabled={isSendingOutreach}
                        className="flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/15 disabled:opacity-50"
                      >
                        {isSendingOutreach ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isSendingOutreach ? 'Logging...' : 'Log SMS Outreach'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-zinc-800/50">
            <button
              onClick={() => setSelectedLead(null)}
              className="px-5 py-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Close (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Top Action & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-xs text-zinc-500 font-semibold">
          Showing <span className="text-white font-bold">{leadsList.length}</span> lead(s)
        </div>
        <div className="flex items-center gap-3">
          {dedupStatus && (
            <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 animate-fade-in">
              {dedupStatus}
            </span>
          )}
          <button
            onClick={handleAutoDeduplicate}
            disabled={isDeduplicating}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-bold transition-all disabled:opacity-50"
            title="Scan database and remove exact duplicate businesses (matching name & barangay)"
          >
            {isDeduplicating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            {isDeduplicating ? 'Cleaning Duplicates...' : 'Auto-Clean Duplicates'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-950/40 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4">Business Details</th>
                <th className="px-6 py-4">Category / Barangay</th>
                <th className="px-6 py-4">Web Status</th>
                <th className="px-6 py-4">Reachability</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-sm text-zinc-300">
              {leadsList.map((lead, idx) => {
                const scoreDetails = getLeadScoreDetails(lead)
                const score = scoreDetails.total
                return (
                  <tr key={lead.id} className="table-row-hover group" style={{ animationDelay: `${idx * 30}ms` }}>
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/15 flex items-center justify-center text-purple-400 font-black text-sm flex-shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{lead.name}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                            {lead.digitalPresence?.websiteUrl ? (
                              <a href={lead.digitalPresence.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-400/80 hover:text-purple-300 transition-colors">
                                <Globe className="w-3 h-3" /> Website
                              </a>
                            ) : (
                              <span className="flex items-center gap-1 text-zinc-600">
                                <HeartCrack className="w-3 h-3" /> No Website
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-200 text-xs">{lead.businessCategory}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.barangay}
                      </div>
                    </td>

                    {/* Web Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${getStatusBadge(lead.digitalPresence?.websiteStatus)}`}>
                        {lead.digitalPresence?.websiteStatus?.replace(/_/g, ' ') || 'UNAUDITED'}
                      </span>
                    </td>

                    {/* Contacts */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {lead.contacts && lead.contacts.length > 0 ? (
                          lead.contacts.map((c: any, index: number) => (
                            <div key={index} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                              {c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@') ? (
                                <Mail className="w-3 h-3 text-purple-400/70" />
                              ) : (
                                <Phone className="w-3 h-3 text-blue-400/70" />
                              )}
                              <span className="font-mono">{c.contactValue}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-amber-500/80 flex items-center gap-1 font-semibold">
                            <HeartCrack className="w-3 h-3" /> Needs Contact
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-lg font-black ${getScoreColor(score)}`}>
                          {score}
                        </span>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBar(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedLead(lead)}
                          className="text-purple-400 hover:text-white inline-flex items-center gap-1 text-xs font-semibold cursor-pointer py-1.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 transition-all group-hover:shadow-md group-hover:shadow-purple-500/5"
                        >
                          Profile <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          disabled={deletingId === lead.id}
                          title={`Delete ${lead.name}`}
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          {deletingId === lead.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {leadsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-zinc-600" />
                      </div>
                      <span className="text-sm text-zinc-500 font-semibold">No leads found matching current filter query.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Modal via React Portal directly into document.body */}
      {mounted && modalJSX && createPortal(modalJSX, document.body)}

      <PitchGeneratorModal
        isOpen={!!pitchModalLeadId}
        onClose={() => setPitchModalLeadId(null)}
        businessId={pitchModalLeadId}
        businessName={pitchModalLeadName}
      />
    </>
  )
}
