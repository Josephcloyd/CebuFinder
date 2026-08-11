'use client'

import { useState, useEffect } from 'react'
import { ApprovalCard } from '../../../components/approval-card'
import { Inbox, RefreshCw, CheckCircle2, Sparkles, Mail } from 'lucide-react'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black gradient-text">Approval Queue</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Review AI-customized email proposals before sending to clients.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actionStatus && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${actionStatus.startsWith('✓') ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : actionStatus.startsWith('✕') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
              {actionStatus}
            </span>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-zinc-400">
            {queue.length} pending
          </span>
          <button
            onClick={fetchQueue}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 border border-zinc-800/60 rounded-xl bg-zinc-900/50 text-zinc-400 hover:text-white cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-24 text-center text-zinc-500 font-semibold flex flex-col items-center justify-center gap-3 dot-pattern rounded-xl border border-zinc-900/50">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            <span>Loading pending approvals...</span>
          </div>
        ) : queue.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 stagger-enter">
            {queue.map((item) => (
              <ApprovalCard key={item.id} item={item} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl py-24 text-center border border-zinc-900/50 flex flex-col items-center justify-center gap-4 dot-pattern relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
              <p className="text-sm text-zinc-500 mt-1">No email outreach drafts are pending approval.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New proposals will appear here when leads are queued for outreach</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
