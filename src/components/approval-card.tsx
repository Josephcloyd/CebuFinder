'use client'

import { useState } from 'react'
import { Check, Edit2, AlertCircle, X, ShieldAlert, Mail, Phone, ExternalLink, Globe } from 'lucide-react'

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
  const scoreColor = score >= 80 ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'

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
    <div className="glass glass-glow rounded-xl p-6 transition-all duration-300 hover:translate-y-[-2px]">
      {/* Header Info */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-purple-300">
            {business.businessCategory}
          </span>
          <h3 className="text-xl font-bold mt-2 text-white">{business.name}</h3>
          <p className="text-sm text-zinc-400 mt-1">📍 Barangay {business.barangay}, Cebu City</p>
        </div>

        {/* Lead Score Badge */}
        <div className={`flex flex-col items-center justify-center border rounded-lg px-4 py-2 ${scoreColor}`}>
          <span className="text-2xl font-black">{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Score</span>
        </div>
      </div>

      {/* Audit & Presence Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Digital Footprint</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm gap-2 text-zinc-300">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Status: <strong className="text-white">{presence?.websiteStatus.replace(/_/g, ' ')}</strong></span>
            </div>
            {presence?.websiteUrl && (
              <a
                href={presence.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-purple-400 hover:underline gap-1"
              >
                View Target Site <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${presence?.hasSsl ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
                {presence?.hasSsl ? '✓ SSL secured' : '✗ No SSL'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${presence?.isMobileResponsive ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
                {presence?.isMobileResponsive ? '✓ Responsive' : '✗ Unresponsive'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Service Opportunity</h4>
          <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
            <span className="text-purple-300 font-bold block mb-1">Service: {analysis?.recommendedService.replace(/_/g, ' ')}</span>
            {analysis?.recommendedOffer}
          </p>
        </div>
      </div>

      {/* Available Contacts */}
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Available Contacts</h4>
        <div className="flex flex-wrap gap-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center gap-2 text-xs bg-zinc-800/80 border border-zinc-700 px-3 py-1.5 rounded-md text-zinc-300">
              {contact.contactType === 'BUSINESS_EMAIL' ? <Mail className="w-3.5 h-3.5 text-purple-400" /> : <Phone className="w-3.5 h-3.5 text-blue-400" />}
              <span>{contact.contactValue}</span>
            </div>
          ))}
          {contacts.length === 0 && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> No contacts found
            </span>
          )}
        </div>
      </div>

      {/* Message Editing & Plain Text Display */}
      <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950 mb-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Personalized Outreach Email</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {isEditing ? 'Cancel Edit' : 'Edit Message'}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email Body</label>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={8}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Subject: <span className="text-zinc-300 font-normal">{subject}</span></p>
            <div className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed bg-zinc-900/30 p-3 rounded border border-zinc-900">
              {messageBody}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={handleOptOut}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-md text-red-400 hover:border-red-500/30 transition-colors mr-auto"
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Block / Opt-Out
        </button>

        <button
          onClick={handleReject}
          className="flex items-center gap-1.5 text-xs px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Reject Lead
        </button>

        <button
          onClick={handleApprove}
          disabled={isSending || contacts.length === 0}
          className="flex items-center gap-1.5 text-xs px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-md text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Check className="w-4 h-4" />
          {isSending ? 'Sending...' : 'Approve & Send Email'}
        </button>
      </div>
    </div>
  )
}
