import type { Metadata } from 'next'
import Link from 'next/link'
import { Inbox, BarChart2, ShieldAlert, Users, Compass } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cebu Digital Finder - Lead Control Engine',
  description: 'AI-Enriched CRM & Qualified Business Outreach for Cebu City',
}

interface LayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex flex-col fixed h-full z-10">
        {/* Brand */}
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
            C
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white">Cebu Digital</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Finder Engine</p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition-all group"
          >
            <BarChart2 className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <span>Performance Overview</span>
          </Link>

          <Link
            href="/approval"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition-all group"
          >
            <Inbox className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <span>Approval Queue</span>
          </Link>

          <Link
            href="/leads"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition-all group"
          >
            <Users className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <span>Leads Database (CRM)</span>
          </Link>

          <Link
            href="/suppression"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition-all group"
          >
            <ShieldAlert className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <span>Suppression Manager</span>
          </Link>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-900 text-[10px] text-zinc-500 font-bold">
          <div className="flex items-center gap-1.5 mb-1">
            <Compass className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-zinc-400">Target Area: Cebu City</span>
          </div>
          <span>Version 1.0.0 (MVP)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/40 backdrop-blur-sm sticky top-0 z-5">
          <div className="text-xs font-semibold text-zinc-500 flex items-center gap-2">
            <span>Server Status:</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-zinc-400 font-bold">Online</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
