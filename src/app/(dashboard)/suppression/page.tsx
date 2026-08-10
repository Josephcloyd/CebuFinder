'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react'

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

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Suppression Manager</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage Do Not Contact (DNC) lists, bounces, and unsubscribe logs.</p>
        </div>
        <button
          onClick={fetchList}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Manual Add Card */}
        <div className="glass rounded-xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Add Contact to Suppression</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Force-add an email address, domain, or phone number to the suppression list. The dispatch queue performs hard checks against this list before sending any outreach.
          </p>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Contact Value (Email/Domain/Phone)</label>
              <input
                type="text"
                placeholder="e.g. info@domain.com or 639171234567"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Reason for Suppression</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="USER_DNC_REQUEST">Do Not Contact (Requested by Lead)</option>
                <option value="BOUNCED">Invalid Address / Hard Bounce</option>
                <option value="COMPLAINT">Spam Complaint / Flagged</option>
                <option value="MANUAL_BLACKLIST">Manual Blacklist (Internal)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all cursor-pointer"
            >
              Add to Suppression
            </button>
          </form>

          {submitStatus && (
            <div className={`mt-4 text-xs font-semibold p-3 rounded-lg border ${submitStatus.startsWith('✓') ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {submitStatus}
            </div>
          )}
        </div>

        {/* Current Suppression List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Active Suppression Records</h3>
          </div>

          <div className="glass rounded-xl overflow-hidden border border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <th className="px-6 py-4">Suppressed Contact</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Date Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                  {list.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{item.contactValue}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700 text-purple-300 font-bold">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(item.dateAdded).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {list.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 font-semibold flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" /> No contacts currently suppressed.
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
