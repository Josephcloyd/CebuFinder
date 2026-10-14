'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Mail, Phone, HeartCrack, ChevronRight, X, Building2, MapPin, Sparkles, Copy, ExternalLink, Send, MessageSquare, Smartphone, Check, RefreshCw, Star, TrendingUp, Calendar, Zap, Plus, ShieldCheck, AlertCircle, Trash2, Sparkle } from 'lucide-react'
import { PitchGeneratorModal } from './pitch-generator-modal'
import { formatBusinessAgeWithYear } from '../lib/utils/business-age'

interface LeadTableProps {
  leads: Array<{
    id: string
    name: string
    businessCategory: string
    barangay: string
    city?: string
    dateDiscovered: string
    establishedYear?: number | null
    establishedYearSource?: string | null
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
  // Delete State
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
    if (score >= 80) return 'text-primary'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-muted-foreground'
  }

  const getScoreBar = (score: number) => {
    if (score >= 90) return 'bg-emerald-600'
    if (score >= 80) return 'bg-primary'
    if (score >= 70) return 'bg-primary'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-muted-foreground'
  }

  const modalJSX = selectedLead ? (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setSelectedLead(null) }}
    >
      <div className="bg-background border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl  relative animate-scale-in my-auto">
        
        {/* Modal Header with gradient top accent */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div className="p-6 pb-5 relative">
            {/* Close button */}
            <button 
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-all cursor-pointer"
              title="Close Modal (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-foreground font-semibold text-2xl shadow-lg  shrink-0">
                {selectedLead.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-semibold text-foreground">{selectedLead.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold">
                    {selectedLead.businessCategory}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Barangay {selectedLead.barangay}, {selectedLead.city || 'Cebu City'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border mb-6 pb-3">
            <button
              onClick={() => setModalTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                modalTab === 'profile'
                  ? 'bg-secondary/90 text-foreground border border-border/60 shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-primary" />
              Profile & Audit Summary
            </button>
            <button
              onClick={() => setModalTab('outreach')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                modalTab === 'outreach'
                  ? 'btn-primary text-foreground shadow-lg'
                  : 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/30'
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
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-primary hover:bg-[#355448] text-foreground shadow-lg "
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
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
                  <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
                    <div className="p-4 rounded-xl bg-card border border-border relative overflow-hidden">
                      <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary" />
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Opportunity Score</div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className={`text-3xl font-semibold ${getScoreColor(scoreDetails.total)}`}>
                          {scoreDetails.total}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">/ 100</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${getScoreBar(scoreDetails.total)}`} 
                          style={{ width: `${scoreDetails.total}%` }} 
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border relative overflow-hidden">
                      <div className="absolute left-0 right-0 top-0 h-0.5 bg-amber-500" />
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Web Presence</div>
                      <div className="mt-2">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${getStatusBadge(selectedLead.digitalPresence?.websiteStatus)}`}>
                          {selectedLead.digitalPresence?.websiteStatus?.replace(/_/g, ' ') || 'UNAUDITED'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border relative overflow-hidden">
                      <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary" />
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Discovery Date</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-foreground">
                          {selectedLead.dateDiscovered ? new Date(selectedLead.dateDiscovered).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border relative overflow-hidden">
                      <div className="absolute left-0 right-0 top-0 h-0.5 bg-emerald-500" />
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Business age</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-foreground">{formatBusinessAgeWithYear(selectedLead.establishedYear)}</span>
                      </div>
                      {selectedLead.establishedYearSource && <p className="mt-1 text-[9px] text-muted-foreground">Source: {selectedLead.establishedYearSource}</p>}
                    </div>
                  </div>
                )
              })()}

              {/* Score Breakdown Factors */}
              {(() => {
                const scoreDetails = getLeadScoreDetails(selectedLead)
                return (
                  <div className="p-4 rounded-xl bg-card border border-border mb-6">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Opportunity Score Breakdown
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/90 border border-border">
                        <span className="text-muted-foreground">Digital Need Impact:</span>
                        <span className="font-bold text-primary">+{scoreDetails.digitalNeedScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/90 border border-border">
                        <span className="text-muted-foreground">Reachability Score:</span>
                        <span className="font-bold text-blue-400">+{scoreDetails.reachabilityScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/90 border border-border">
                        <span className="text-muted-foreground">Category Value Margin:</span>
                        <span className="font-bold text-emerald-400">+{scoreDetails.categoryScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/90 border border-border">
                        <span className="text-muted-foreground">Operating Signal:</span>
                        <span className="font-bold text-amber-400">+{scoreDetails.activityScore} pts</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Recommended Service */}
              <div className="relative mb-6 overflow-hidden rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Recommended Growth Package
                </div>
                <p className="text-sm text-foreground mt-1.5 font-bold">
                  {getRecommendedServiceLabel(selectedLead.opportunityAnalysis?.recommendedService, selectedLead.businessCategory)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {selectedLead.opportunityAnalysis?.opportunitySummary || `Strategic opportunity to launch automated client acquisition systems for ${selectedLead.name}.`}
                </p>
              </div>

              {/* Contacts List with Add Contact Button */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" /> Contact Channels
                  </h4>
                  <button
                    onClick={() => setIsAddingContact(!isAddingContact)}
                    className="text-[11px] font-bold text-primary hover:text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingContact ? 'Cancel' : 'Add Contact'}
                  </button>
                </div>

                {/* Inline Contact Add Form */}
                {isAddingContact && (
                  <form onSubmit={handleAddContactSubmit} className="p-3.5 rounded-xl bg-card border border-primary/40 space-y-3 animate-fade-in">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-primary" /> Attach Contact Channel
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newContactType}
                        onChange={(e) => setNewContactType(e.target.value as any)}
                        className="bg-background border border-border rounded-xl px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="BUSINESS_EMAIL">Email</option>
                        <option value="BUSINESS_PHONE">Phone / Text</option>
                      </select>
                      <input
                        type="text"
                        placeholder={newContactType === 'BUSINESS_EMAIL' ? 'e.g. info@clinic.com' : 'e.g. 09171234567'}
                        value={newContactValue}
                        onChange={(e) => setNewContactValue(e.target.value)}
                        className="col-span-2 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full btn-primary text-foreground font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Contact to Lead Profile
                    </button>
                  </form>
                )}

                {contactAddStatus && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold ${contactAddStatus.startsWith('✓') ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {contactAddStatus}
                  </div>
                )}

                {selectedLead.contacts && selectedLead.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLead.contacts.map((c: any, idx: number) => {
                      const isEmail = c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@')
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-sm group/contact hover:border-border transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEmail ? 'bg-primary/10 border border-primary/25' : 'bg-blue-500/10 border border-blue-500/15'}`}>
                              {isEmail ? <Mail className="w-4 h-4 text-primary" /> : <Phone className="w-4 h-4 text-blue-400" />}
                            </div>
                            <div>
                              <span className="text-foreground font-mono text-xs">{c.contactValue}</span>
                              <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
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
                              className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
                      className="text-[11px] font-bold text-primary underline cursor-pointer"
                    >
                      + Add One Now
                    </button>
                  </div>
                )}
              </div>

              {/* Digital Footprint / Web Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Digital Footprint
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.digitalPresence?.websiteUrl ? (
                    <a
                      href={selectedLead.digitalPresence.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/10 border border-primary/25 hover:border-primary/30 text-primary text-xs font-semibold transition-all"
                    >
                      <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card border border-border">
                      <HeartCrack className="w-3.5 h-3.5 text-muted-foreground" /> No Website Detected
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
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-semibold">1</span>
                  Service Offer Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateTemplate('WEB_IMPROVEMENT', selectedLead)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      offerType === 'WEB_IMPROVEMENT'
                        ? 'bg-primary/10 border-primary/40 text-foreground'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Globe className="w-4 h-4 text-primary" /> Website Improvement
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Modern web app, redesign & SEO upgrade.</p>
                  </button>
                  <button
                    onClick={() => updateTemplate('SYSTEM_CREATION', selectedLead)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      offerType === 'SYSTEM_CREATION'
                        ? 'bg-primary/10 border-primary/40 text-foreground'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-primary" /> Custom System & Portal
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Booking system, management software & CRM.</p>
                  </button>
                </div>
              </div>

              {/* Step 2: Channel Selector */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-semibold">2</span>
                  Communication Channel
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOutreachChannel('EMAIL')}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      outreachChannel === 'EMAIL'
                        ? 'btn-primary text-foreground shadow-lg'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email Proposal
                  </button>
                  <button
                    onClick={() => setOutreachChannel('SMS')}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      outreachChannel === 'SMS'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Text / WhatsApp
                  </button>
                </div>
              </div>

              {/* Step 3: Message Content */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-semibold">3</span>
                  Compose Message
                </label>
                <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                  {outreachChannel === 'EMAIL' && (
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Email Subject</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
                      {outreachChannel === 'EMAIL' ? 'Email Body' : 'Text / SMS Content'}
                    </label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      rows={7}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary leading-relaxed font-sans transition-colors"
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
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-semibold">4</span>
                  Send or Copy
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopy(customBody, 'outreach-body')}
                    className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-foreground hover:text-foreground hover:border-border cursor-pointer transition-all"
                  >
                    {copiedField === 'outreach-body' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'outreach-body' ? 'Copied!' : 'Copy Text'}
                  </button>

                  {outreachChannel === 'EMAIL' ? (
                    <>
                      <a
                        href={`mailto:${selectedLead.contacts?.find((c: any) => c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@'))?.contactValue || ''}?subject=${encodeURIComponent(customSubject)}&body=${encodeURIComponent(customBody)}`}
                        className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-primary hover:text-primary hover:border-primary/30 cursor-pointer transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in Mail App
                      </a>

                      <button
                        onClick={handleSendDirectOutreach}
                        disabled={isSendingOutreach}
                        className="flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-xl btn-primary text-foreground font-bold transition-all cursor-pointer disabled:opacity-50"
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
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Open WhatsApp
                          </a>
                        ) : null
                      })()}

                      <button
                        onClick={handleSendDirectOutreach}
                        disabled={isSendingOutreach}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[#355448] disabled:opacity-50"
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
          <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-border">
            <button
              onClick={() => setSelectedLead(null)}
              className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary border border-border text-foreground text-xs font-semibold transition-all cursor-pointer"
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
      {/* Table status */}
      <div className="mb-3 flex items-center">
        <div className="text-xs font-medium text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{leadsList.length}</span> leads
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-4">Business Details</th>
                <th className="px-6 py-4">Category / Barangay</th>
                <th className="px-6 py-4">Web Status</th>
                <th className="px-6 py-4">Reachability</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {leadsList.map((lead, idx) => {
                const scoreDetails = getLeadScoreDetails(lead)
                const score = scoreDetails.total
                return (
                  <tr key={lead.id} className="table-row-hover group" style={{ animationDelay: `${idx * 30}ms` }}>
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-primary">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">{lead.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            {lead.digitalPresence?.websiteUrl ? (
                              <a href={lead.digitalPresence.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary/80 hover:text-primary transition-colors">
                                <Globe className="w-3 h-3" /> Website
                              </a>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <HeartCrack className="w-3 h-3" /> No Website
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground">{formatBusinessAgeWithYear(lead.establishedYear)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground text-xs">{lead.businessCategory}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
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
                            <div key={index} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              {c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@') ? (
                                <Mail className="w-3 h-3 text-primary/70" />
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
                        <span className={`text-lg font-semibold ${getScoreColor(score)}`}>
                          {score}
                        </span>
                        <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBar(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedLead(lead)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          Profile <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          disabled={deletingId === lead.id}
                          title={`Delete ${lead.name}`}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
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
                      <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground font-semibold">No leads found matching current filter query.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {leadsList.map((lead) => {
          const score = getLeadScoreDetails(lead).total
          return (
            <article key={lead.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{lead.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {lead.barangay} · {lead.businessCategory}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatBusinessAgeWithYear(lead.establishedYear)}</p>
                </div>
                <span className={`text-lg font-semibold ${getScoreColor(score)}`}>{score}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-1 text-[10px] font-medium ${getStatusBadge(lead.digitalPresence?.websiteStatus)}`}>
                  {lead.digitalPresence?.websiteStatus?.replace(/_/g, ' ') || 'UNAUDITED'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {lead.contacts?.length ? `${lead.contacts.length} contact${lead.contacts.length === 1 ? '' : 's'}` : 'No contact yet'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <button onClick={() => setSelectedLead(lead)} className="flex items-center gap-1 text-xs font-semibold text-primary">
                  View profile <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteLead(lead.id, lead.name)}
                  disabled={deletingId === lead.id}
                  aria-label={`Delete ${lead.name}`}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === lead.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </article>
          )
        })}
        {leadsList.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            No leads match the current filters.
          </div>
        )}
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
