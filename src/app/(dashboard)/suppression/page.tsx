'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, Trash2, RefreshCw, AlertCircle, Shield, Lock } from 'lucide-react'

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
    'MANUAL_BLACKLIST': 'bg-zinc-700/50 border-zinc-600/40 text-zinc-300',
    'RESEND_WEBHOOK': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black gradient-text">Suppression Manager</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Manage Do Not Contact (DNC) lists, bounces, and unsubscribe logs.</p>
          </div>
        </div>
        <button
          onClick={fetchList}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 border border-zinc-800/60 rounded-xl bg-zinc-900/50 text-zinc-400 hover:text-white cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Manual Add Card */}
        <div className="glass-card rounded-2xl p-6 h-fit relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/15 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Add to Suppression</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
            Force-add an email address, domain, or phone number to the suppression list. The dispatch queue checks this list before sending any outreach.
          </p>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Contact Value</label>
              <input
                type="text"
                placeholder="e.g. info@domain.com or 639171234567"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Reason for Suppression</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-red-500/40 transition-colors"
              >
                <option value="USER_DNC_REQUEST">Do Not Contact (Requested by Lead)</option>
                <option value="BOUNCED">Invalid Address / Hard Bounce</option>
                <option value="COMPLAINT">Spam Complaint / Flagged</option>
                <option value="MANUAL_BLACKLIST">Manual Blacklist (Internal)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-red-500/15 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Add to Suppression
            </button>
          </form>

          {submitStatus && (
            <div className={`mt-4 text-xs font-semibold p-3 rounded-xl border ${submitStatus.startsWith('✓') ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {submitStatus}
            </div>
          )}
        </div>

        {/* Current Suppression List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">Active Suppression Records</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {list.length} suppressed
            </span>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/50 bg-zinc-950/40 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-6 py-4">Suppressed Contact</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Date Registered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-sm text-zinc-300">
                  {list.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="px-6 py-4 font-bold text-white font-mono text-xs">{item.contactValue}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${reasonBadges[item.reason] || 'bg-zinc-800/80 border-zinc-700 text-zinc-300'}`}>
                          {item.reason?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(item.dateAdded).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
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
                          <div className="w-12 h-12 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-zinc-600" />
                          </div>
                          <span className="text-sm text-zinc-500 font-semibold">No contacts currently suppressed.</span>
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
