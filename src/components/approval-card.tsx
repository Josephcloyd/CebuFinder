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
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30">
      {/* Gradient top accent */}
      <div className="h-0.5 bg-primary" />

      <div className="p-6">
        {/* Header Info */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-semibold text-primary">
              {business.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-secondary border border-border text-foreground uppercase tracking-wider">
                {business.businessCategory}
              </span>
              <h3 className="text-lg font-bold mt-1.5 text-foreground">{business.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Barangay {business.barangay}, Cebu City
              </p>
            </div>
          </div>

          {/* Lead Score Badge */}
          <div className="flex flex-col items-center justify-center rounded-xl px-3 py-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary" />
            <span className="text-2xl font-semibold text-foreground relative z-10">{score}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground relative z-10">Score</span>
          </div>
        </div>

        {/* Audit & Presence Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-card border border-border">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Digital Footprint
            </h4>
            <div className="space-y-2">
              <div className="flex items-center text-xs gap-2 text-foreground">
                <span>Status: <strong className="text-foreground">{presence?.websiteStatus.replace(/_/g, ' ')}</strong></span>
              </div>
              {presence?.websiteUrl && (
                <a
                  href={presence.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[11px] text-primary hover:text-primary gap-1 transition-colors"
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
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Service Opportunity
            </h4>
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              <span className="text-primary font-bold block mb-1">{analysis?.recommendedService.replace(/_/g, ' ')}</span>
              {analysis?.recommendedOffer}
            </p>
          </div>
        </div>

        {/* Available Contacts */}
        <div className="mb-5">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Available Contacts</h4>
          <div className="flex flex-wrap gap-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-2 text-xs bg-secondary border border-border px-3 py-2 rounded-xl text-foreground hover:border-border transition-all">
                {contact.contactType === 'BUSINESS_EMAIL' ? (
                  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-primary" />
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
        <div className="border border-border rounded-xl overflow-hidden bg-background/50 mb-5">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Personalized Outreach Email
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary transition-colors cursor-pointer font-semibold"
            >
              <Edit2 className="w-3 h-3" />
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
          </div>

          <div className="p-4">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Email Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Email Body</label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={8}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground">Subject: <span className="text-foreground font-normal">{subject}</span></p>
                <div className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-card p-3.5 rounded-xl border border-border">
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
            className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 border border-border hover:bg-red-500/5 hover:border-red-500/20 rounded-xl text-red-400/70 hover:text-red-400 transition-all mr-auto cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Block / Opt-Out
          </button>

          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 text-xs px-4 py-2.5 border border-border hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={isSending || contacts.length === 0}
            className="flex items-center gap-1.5 text-xs px-5 py-2.5 btn-primary rounded-xl text-foreground font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
