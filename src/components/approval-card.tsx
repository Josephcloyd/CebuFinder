'use client'

import { useState } from 'react'
import { Check, Edit2, AlertCircle, X, ShieldAlert, Mail, Phone, ExternalLink, Globe, Sparkles, Send, Building2 } from 'lucide-react'

interface ApprovalCardProps {
  item: {
    id: string
    subject: string
    messageBody: string
    business: {
      id: string
      name: string
      businessCategory: string
      barangay: string
      digitalPresence?: {
        websiteUrl?: string
        websiteStatus: string
        hasSsl: boolean
        isMobileResponsive: boolean
      }
      opportunityAnalysis?: {
        leadScore: number
        primaryProblem: string
        recommendedService: string
        recommendedOffer: string
        opportunitySummary: string
      }
      contacts: Array<{
        id: string
        contactType: string
        contactValue: string
      }>
    }
  }
  onAction: (outreachId: string, action: 'approve' | 'reject' | 'opt-out', data?: { subject: string; messageBody: string }) => void
}

export function ApprovalCard({ item, onAction }: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [subject, setSubject] = useState(item.subject)
  const [messageBody, setMessageBody] = useState(item.messageBody)
  const [isSending, setIsSending] = useState(false)

  const business = item.business
  const presence = business.digitalPresence
  const analysis = business.opportunityAnalysis
  const contacts = business.contacts

  const score = analysis?.leadScore ?? 0
  
  const getScoreGradient = (s: number) => {
    if (s >= 90) return 'from-emerald-500 to-green-400'
    if (s >= 80) return 'from-purple-500 to-indigo-400'
    if (s >= 70) return 'from-blue-500 to-cyan-400'
    return 'from-amber-500 to-yellow-400'
  }

  const handleApprove = async () => {
    setIsSending(true)
    await onAction(item.id, 'approve', { subject, messageBody })
    setIsSending(false)
    setIsEditing(false)
  }

  const handleReject = () => {
    onAction(item.id, 'reject')
  }

  const handleOptOut = () => {
    if (confirm(`Add ${business.name}'s contacts to the Do Not Contact list?`)) {
      onAction(item.id, 'opt-out')
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-purple-500/5">
      {/* Gradient top accent */}
      <div className="h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />

      <div className="p-6">
        {/* Header Info */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/15 flex items-center justify-center text-purple-400 font-black text-lg flex-shrink-0">
              {business.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 uppercase tracking-wider">
                {business.businessCategory}
              </span>
              <h3 className="text-lg font-bold mt-1.5 text-white">{business.name}</h3>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Barangay {business.barangay}, Cebu City
              </p>
            </div>
          </div>

          {/* Lead Score Badge */}
          <div className="flex flex-col items-center justify-center rounded-xl px-3 py-2 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(score)} opacity-10`} />
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getScoreGradient(score)}`} />
            <span className="text-2xl font-black text-white relative z-10">{score}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 relative z-10">Score</span>
          </div>
        </div>

        {/* Audit & Presence Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Digital Footprint
            </h4>
            <div className="space-y-2">
              <div className="flex items-center text-xs gap-2 text-zinc-300">
                <span>Status: <strong className="text-white">{presence?.websiteStatus.replace(/_/g, ' ')}</strong></span>
              </div>
              {presence?.websiteUrl && (
                <a
                  href={presence.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[11px] text-purple-400 hover:text-purple-300 gap-1 transition-colors"
                >
                  View Site <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${presence?.hasSsl ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'}`}>
                  {presence?.hasSsl ? '✓ SSL' : '✗ No SSL'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${presence?.isMobileResponsive ? 'border-green-500/20 text-green-400 bg-green-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'}`}>
                  {presence?.isMobileResponsive ? '✓ Responsive' : '✗ Not Responsive'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Service Opportunity
            </h4>
            <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
              <span className="text-purple-300 font-bold block mb-1">{analysis?.recommendedService.replace(/_/g, ' ')}</span>
              {analysis?.recommendedOffer}
            </p>
          </div>
        </div>

        {/* Available Contacts */}
        <div className="mb-5">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Available Contacts</h4>
          <div className="flex flex-wrap gap-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-2 text-xs bg-zinc-900/50 border border-zinc-800/50 px-3 py-2 rounded-xl text-zinc-300 hover:border-zinc-700/50 transition-all">
                {contact.contactType === 'BUSINESS_EMAIL' ? (
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-purple-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                    <Phone className="w-3 h-3 text-blue-400" />
                  </div>
                )}
                <span className="font-mono text-[11px]">{contact.contactValue}</span>
              </div>
            ))}
            {contacts.length === 0 && (
              <span className="text-xs text-red-400/80 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> No contacts found
              </span>
            )}
          </div>
        </div>

        {/* Message Editing & Plain Text Display */}
        <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-zinc-950/50 mb-5">
          <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3 bg-zinc-900/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Personalized Outreach Email
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer font-semibold"
            >
              <Edit2 className="w-3 h-3" />
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
          </div>

          <div className="p-4">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Email Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Email Body</label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={8}
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-colors leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-zinc-400">Subject: <span className="text-white font-normal">{subject}</span></p>
                <div className="text-[11px] text-zinc-400 whitespace-pre-wrap leading-relaxed bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-800/40">
                  {messageBody}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button
            onClick={handleOptOut}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 border border-zinc-800/50 hover:bg-red-500/5 hover:border-red-500/20 rounded-xl text-red-400/70 hover:text-red-400 transition-all mr-auto cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Block / Opt-Out
          </button>

          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 text-xs px-4 py-2.5 border border-zinc-800/50 hover:bg-zinc-800/50 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={isSending || contacts.length === 0}
            className="flex items-center gap-1.5 text-xs px-5 py-2.5 btn-primary rounded-xl text-white font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Approve & Send</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
