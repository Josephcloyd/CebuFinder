'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, Trash2, RefreshCw, AlertCircle, Lock } from 'lucide-react'

export default function SuppressionPage() {
  const [list, setList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Form input
  const [contactValue, setContactValue] = useState('')
  const [reason, setReason] = useState('USER_DNC_REQUEST')
  const [submitStatus, setSubmitStatus] = useState('')

  const fetchList = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/suppression')
      const data = await response.json()
      if (data.success) {
        setList(data.list)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactValue) return
    
    setSubmitStatus('Adding...')
    try {
      const response = await fetch('/api/v1/suppression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactValue, reason })
      })
      const result = await response.json()
      
      if (result.success) {
        setSubmitStatus('✓ Contact suppressed')
        setContactValue('')
        fetchList()
        setTimeout(() => setSubmitStatus(''), 2000)
      } else {
        setSubmitStatus(`✕ Error: ${result.error}`)
      }
    } catch (err: any) {
      setSubmitStatus(`✕ Connection error: ${err.message}`)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/suppression?id=${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        fetchList()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const reasonBadges: Record<string, string> = {
    'USER_DNC_REQUEST': 'bg-red-500/10 border-red-500/20 text-red-400',
    'BOUNCED': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    'COMPLAINT': 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    'MANUAL_BLACKLIST': 'bg-secondary border-border text-foreground',
    'RESEND_WEBHOOK': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Outreach safety</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">Suppression list</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage do-not-contact requests, bounces, and unsubscribe records.</p>
        </div>
        <button
          onClick={fetchList}
          disabled={isLoading}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Manual Add Card */}
        <div className="h-fit rounded-xl border border-border bg-card p-6">

          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
              <Lock className="w-3.5 h-3.5 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Add to Suppression</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            Force-add an email address, domain, or phone number to the suppression list. The dispatch queue checks this list before sending any outreach.
          </p>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Contact Value</label>
              <input
                type="text"
                placeholder="e.g. info@domain.com or 639171234567"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/40 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Reason for Suppression</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500/40 transition-colors"
              >
                <option value="USER_DNC_REQUEST">Do Not Contact (Requested by Lead)</option>
                <option value="BOUNCED">Invalid Address / Hard Bounce</option>
                <option value="COMPLAINT">Spam Complaint / Flagged</option>
                <option value="MANUAL_BLACKLIST">Manual Blacklist (Internal)</option>
              </select>
            </div>

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800"
            >
              <ShieldAlert className="w-4 h-4" />
              Add to Suppression
            </button>
          </form>

          {submitStatus && (
            <div className={`mt-4 text-xs font-semibold p-3 rounded-xl border ${submitStatus.startsWith('✓') ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {submitStatus}
            </div>
          )}
        </div>

        {/* Current Suppression List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-foreground">Active Suppression Records</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {list.length} suppressed
            </span>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background/40 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-4">Suppressed Contact</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Date Registered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {list.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="px-6 py-4 font-bold text-foreground font-mono text-xs">{item.contactValue}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${reasonBadges[item.reason] || 'bg-secondary border-border text-foreground'}`}>
                          {item.reason?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(item.dateAdded).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Remove from suppression list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {list.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-muted-foreground font-semibold">No contacts currently suppressed.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
