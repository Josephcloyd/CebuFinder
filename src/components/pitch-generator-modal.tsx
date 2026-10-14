'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X, Send, Check, Copy, AlertCircle, RefreshCw, Layers, Mail, Loader2 } from 'lucide-react'

interface PitchGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string | null
  businessName?: string
}

export function PitchGeneratorModal({
  isOpen,
  onClose,
  businessId,
  businessName,
}: PitchGeneratorModalProps) {
  const [tone, setTone] = useState<'FRIENDLY' | 'PROFESSIONAL' | 'URGENT'>('FRIENDLY')
  const [pitchData, setPitchData] = useState<any | null>(null)
  const [subject, setSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [copied, setCopied] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [toEmail, setToEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)

  const generatePitch = async (selectedTone = tone) => {
    if (!businessId) return
    setIsGenerating(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/v1/pitch/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, tone: selectedTone }),
      })
      const data = await res.json()
      if (data.success) {
        setPitchData(data.pitch)
        setSubject(data.pitch.subject)
        setEmailBody(data.pitch.emailBody)
      } else {
        setStatusMessage(`Error: ${data.error}`)
      }
    } catch (err: any) {
      setStatusMessage(`Failed to generate pitch: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (isOpen && businessId) {
      generatePitch('FRIENDLY')
    }
  }, [isOpen, businessId])

  if (!isOpen || !businessId) return null

  const handleToneChange = (newTone: 'FRIENDLY' | 'PROFESSIONAL' | 'URGENT') => {
    setTone(newTone)
    generatePitch(newTone)
  }

  const handleCopy = () => {
    const fullContent = `Subject: ${subject}\n\n${emailBody}`
    navigator.clipboard.writeText(fullContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApprove = async () => {
    setIsSending(true)
    try {
      const res = await fetch('/api/v1/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          subject,
          messageBody: emailBody,
          action: 'APPROVE',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage('✅ Approved! Moved to Outreach Queue.')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setStatusMessage(`Error: ${data.error || 'Failed to approve.'}`)
      }
    } catch (err: any) {
      setStatusMessage(`Error approving pitch: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleSendEmail = async () => {
    if (!toEmail || !businessId) return
    setIsSendingEmail(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/v1/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, toEmail, subject, body: emailBody }),
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage(`✅ Email sent to ${toEmail}!`)
        setShowEmailInput(false)
        setToEmail('')
        setTimeout(() => onClose(), 1800)
      } else {
        setStatusMessage(`❌ ${data.error}`)
      }
    } catch (err: any) {
      setStatusMessage(`❌ ${err.message}`)
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Pitch Studio</h3>
              <p className="text-xs text-muted-foreground">
                Tailored pitch for <strong className="text-foreground">{pitchData?.businessName || businessName || 'Business'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-card hover:bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Tone Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Select Pitch Tone</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleToneChange('FRIENDLY')}
                disabled={isGenerating}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tone === 'FRIENDLY'
                    ? 'bg-primary/10 border-primary/50 text-primary shadow-lg '
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🤝 Consultative & Friendly
              </button>
              <button
                onClick={() => handleToneChange('PROFESSIONAL')}
                disabled={isGenerating}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tone === 'PROFESSIONAL'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/10'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🎯 Direct & Professional
              </button>
              <button
                onClick={() => handleToneChange('URGENT')}
                disabled={isGenerating}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tone === 'URGENT'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                ⚡ High Impact & Urgent
              </button>
            </div>
          </div>

          {/* Audit Gap Card */}
          {pitchData && (
            <div className="p-3.5 rounded-xl bg-card border border-border text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground">Detected Gap: </span>
                <span className="text-muted-foreground">{pitchData.auditHook}</span>
              </div>
            </div>
          )}

          {/* Subject Line & Variations */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject Line</label>
              {pitchData?.subjectVariations && (
                <select
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-card border border-border text-[11px] text-primary rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="">A/B Subject Line Variations...</option>
                  {pitchData.subjectVariations.map((varSub: string, idx: number) => (
                    <option key={idx} value={varSub}>
                      Option {idx + 1}: {varSub}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground font-medium focus:outline-none focus:border-primary"
            />
          </div>

          {/* Email Body Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Pitch Body</label>
            <textarea
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-background border border-border rounded-xl p-3.5 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs font-semibold text-primary">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-background space-y-3">
          {/* Email input row (shown when Send Email clicked) */}
          {showEmailInput && (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@email.com"
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
              />
              <button
                onClick={handleSendEmail}
                disabled={!toEmail || isSendingEmail}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send
              </button>
              <button onClick={() => setShowEmailInput(false)} className="text-muted-foreground hover:text-foreground text-xs px-2">
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setShowEmailInput((v) => !v)}
                disabled={!pitchData || isGenerating}
                className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-card hover:bg-secondary text-muted-foreground text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isSending || isGenerating}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-[#355448] text-foreground text-xs font-bold shadow-lg  flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Approve & Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
