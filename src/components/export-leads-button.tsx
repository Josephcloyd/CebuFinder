'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, Mail, ShieldAlert, ChevronDown, Check } from 'lucide-react'

interface ExportLeadsButtonProps {
  hasContacts?: boolean
  city?: string
  barangay?: string
  category?: string
  status?: string
}

export function ExportLeadsButton({
  hasContacts,
  city,
  barangay,
  category,
  status,
}: ExportLeadsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const triggerExport = (onlyWithEmail = false, filterStatus?: string) => {
    setIsExporting(true)
    setIsOpen(false)

    const params = new URLSearchParams()
    if (hasContacts !== undefined) params.append('hasContacts', String(hasContacts))
    if (city && city !== 'ALL') params.append('city', city)
    if (barangay && barangay !== 'ALL') params.append('barangay', barangay)
    if (category && category !== 'ALL') params.append('category', category)
    if (filterStatus || (status && status !== 'ALL')) {
      params.append('status', filterStatus || status || '')
    }
    if (onlyWithEmail) params.append('onlyWithEmail', 'true')

    const downloadUrl = `/api/v1/leads/export?${params.toString()}`

    // Trigger browser file download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `cebu_digital_leads_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => setIsExporting(false), 1000)
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
        <span>{isExporting ? 'Preparing CSV...' : 'Download CSV'}</span>
        <ChevronDown className="w-3 h-3 text-emerald-200" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in p-1.5 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900 mb-1">
            CSV Export Formats
          </div>

          <button
            onClick={() => triggerExport(false)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-900 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Current Leads (CSV)</span>
          </button>

          <button
            onClick={() => triggerExport(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-900 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Email Contacts Only</span>
          </button>

          <button
            onClick={() => triggerExport(false, 'NO_WEBSITE')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-900 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Export No Website Leads Only</span>
          </button>
        </div>
      )}
    </div>
  )
}
