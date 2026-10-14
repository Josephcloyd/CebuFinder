'use client'

import { useState, useEffect } from 'react'
import { ApprovalCard } from '../../../components/approval-card'
import { RefreshCw, CheckCircle2, Sparkles } from 'lucide-react'

export default function ApprovalQueuePage() {
  const [queue, setQueue] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState('')

  const fetchQueue = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/approval')
      const data = await response.json()
      if (data.success) {
        setQueue(data.queue)
      }
    } catch (err) {
      console.error('Error fetching approval queue:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleAction = async (
    outreachId: string,
    action: 'approve' | 'reject' | 'opt-out',
    data?: { subject: string; messageBody: string }
  ) => {
    setActionStatus(`Executing ${action}...`)
    try {
      const response = await fetch(`/api/v1/approval/${outreachId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          subject: data?.subject,
          messageBody: data?.messageBody,
        })
      })
      const result = await response.json()
      
      if (result.success) {
        setActionStatus(`✓ Successfully ${action}d.`)
        setQueue((prev) => prev.filter((item) => item.id !== outreachId))
        setTimeout(() => setActionStatus(''), 1500)
      } else {
        setActionStatus(`✕ Action failed: ${result.error}`)
      }
    } catch (err: any) {
      setActionStatus(`✕ Connection Error: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Outreach review</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">Approval queue</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review and approve every proposal before it reaches a business.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actionStatus && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${actionStatus.startsWith('✓') ? 'bg-primary/10 border-primary/30 text-primary' : actionStatus.startsWith('✕') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-card border-border text-muted-foreground'}`}>
              {actionStatus}
            </span>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-card border border-border text-muted-foreground">
            {queue.length} pending
          </span>
          <button
            onClick={fetchQueue}
            disabled={isLoading}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-24 text-center text-muted-foreground font-semibold flex flex-col items-center justify-center gap-3 dot-pattern rounded-xl border border-border">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span>Loading pending approvals...</span>
          </div>
        ) : queue.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 stagger-enter">
            {queue.map((item) => (
              <ApprovalCard key={item.id} item={item} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Nothing waiting for review</h3>
              <p className="text-sm text-muted-foreground mt-1">No email outreach drafts are pending approval.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New proposals will appear here when leads are queued for outreach</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
