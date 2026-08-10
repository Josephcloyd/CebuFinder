'use client'

import { Globe, Mail, Phone, HeartCrack, ChevronRight } from 'lucide-react'

interface LeadTableProps {
  leads: Array<{
    id: string
    name: string
    businessCategory: string
    barangay: string
    dateDiscovered: string
    digitalPresence?: {
      websiteStatus: string
      websiteUrl?: string
    }
    opportunityAnalysis?: {
      leadScore: number
      recommendedService: string
    }
    contacts: Array<{
      contactType: string
      contactValue: string
    }>
  }>
}

export function LeadTable({ leads }: LeadTableProps) {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'NO_WEBSITE':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'FACEBOOK_ONLY':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'OUTDATED_SITE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'BROKEN_SITE':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      default:
        return 'text-green-400 bg-green-500/10 border-green-500/20'
    }
  }

  return (
    <div className="glass rounded-xl overflow-hidden border border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <th className="px-6 py-4">Business Details</th>
              <th className="px-6 py-4">Category / Barangay</th>
              <th className="px-6 py-4">Web Status</th>
              <th className="px-6 py-4">Reachability</th>
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-900/30 transition-colors">
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-base">{lead.name}</div>
                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                    {lead.digitalPresence?.websiteUrl ? (
                      <a href={lead.digitalPresence.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-400 hover:underline">
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <HeartCrack className="w-3.5 h-3.5" /> No Website
                      </span>
                    )}
                  </div>
                </td>

                {/* Category & Location */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-zinc-200">{lead.businessCategory}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Barangay {lead.barangay}</div>
                </td>

                {/* Web Status */}
                <td className="px-6 py-4">
                  <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${getStatusBadge(lead.digitalPresence?.websiteStatus)}`}>
                    {lead.digitalPresence?.websiteStatus.replace(/_/g, ' ')}
                  </span>
                </td>

                {/* Contacts */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {lead.contacts.map((c, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        {c.contactType === 'BUSINESS_EMAIL' ? <Mail className="w-3.5 h-3.5 text-purple-400" /> : <Phone className="w-3.5 h-3.5 text-blue-400" />}
                        <span>{c.contactValue}</span>
                      </div>
                    ))}
                    {lead.contacts.length === 0 && <span className="text-xs text-red-500">No Contacts Available</span>}
                  </div>
                </td>

                {/* Score */}
                <td className="px-6 py-4 text-center">
                  <span className="text-lg font-black text-purple-400">
                    {lead.opportunityAnalysis?.leadScore ?? 0}
                  </span>
                </td>

                {/* Arrow Action */}
                <td className="px-6 py-4 text-right">
                  <button className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer">
                    Profile <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-semibold">
                  No leads found matching current filter query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
