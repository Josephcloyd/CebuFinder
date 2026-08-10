'use client'

import { useState, useEffect } from 'react'
import { ApprovalCard } from '../../../components/approval-card'
import { Inbox, RefreshCw, CheckCircle2 } from 'lucide-react'

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
        // Filter out from UI queue
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
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Approval Queue</h2>
          <p className="text-sm text-zinc-400 mt-1">Review AI-customized email proposals before sending to clients.</p>
        </div>
        <div className="flex items-center gap-4">
          {actionStatus && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-purple-400">
              {actionStatus}
            </span>
          )}
          <button
            onClick={fetchQueue}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-24 text-center text-zinc-500 font-semibold flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            <span>Loading pending approvals...</span>
          </div>
        ) : queue.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {queue.map((item) => (
              <ApprovalCard key={item.id} item={item} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl py-24 text-center text-zinc-500 border border-zinc-900 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-purple-500 bg-purple-500/10 p-2 rounded-full border border-purple-500/20" />
            <h3 className="text-lg font-bold text-white mt-2">All Caught Up!</h3>
            <p className="text-sm text-zinc-400">No email outreach drafts are pending approval in Cebu City.</p>
          </div>
        )}
      </div>
    </div>
  )
}
