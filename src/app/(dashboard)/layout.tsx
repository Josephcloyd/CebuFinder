'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, BarChart2, ShieldAlert, Users, Compass, UserX, Zap, MapPin, Columns, Radar } from 'lucide-react'
import { AgentChatbox } from '../../components/agent-chatbox'
import { ThemeToggle } from '../../components/theme-toggle'
import { GlobalSearch, SearchTrigger } from '../../components/global-search'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/', label: 'Performance Overview', icon: BarChart2, color: 'purple' },
  { href: '/map', label: 'Cebu Map Explorer', icon: MapPin, color: 'purple' },
  { href: '/pipeline', label: 'Kanban CRM Pipeline', icon: Columns, color: 'purple' },
  { href: '/discovery', label: 'Discovery Automation', icon: Radar, color: 'cyan' },
  { href: '/approval', label: 'Approval Queue', icon: Inbox, color: 'purple' },
  { href: '/leads', label: 'Priority Leads (CRM)', icon: Users, color: 'purple' },
  { href: '/uncontactable', label: 'Needs Contact Info', icon: UserX, color: 'amber' },
  { href: '/suppression', label: 'Suppression Manager', icon: ShieldAlert, color: 'purple' },
]

const colorClasses: Record<string, { active: string; hover: string }> = {
  purple: { active: 'text-purple-400', hover: 'group-hover:text-purple-400' },
  cyan: { active: 'text-cyan-400', hover: 'group-hover:text-cyan-400' },
  amber: { active: 'text-amber-400', hover: 'group-hover:text-amber-400' },
}

export default function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-900/60 bg-zinc-950/90 backdrop-blur-xl flex flex-col fixed h-full z-10">
        {/* Brand */}
        <div className="p-6 border-b border-zinc-900/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-purple-500/25">
            C
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase gradient-text">Cebu Digital</h1>
            <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Finder Engine</p>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Navigation</span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const cols = colorClasses[item.color] || colorClasses.purple
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all group ${
                  isActive
                    ? 'bg-purple-500/10 text-white border border-purple-500/15'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] transition-colors ${
                  isActive ? cols.active : `text-zinc-600 ${cols.hover}`
                }`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-zinc-300 font-bold">System Online</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <Compass className="w-3 h-3 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 font-semibold">Multi-City Coverage</span>
          </div>
          <span className="text-[10px] text-zinc-600 font-bold">v1.1.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen bg-mesh">
        <header className="h-14 border-b border-zinc-900/50 flex items-center justify-between px-6 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-5">
          <div className="text-xs font-semibold text-zinc-500 flex items-center gap-2">
            <span>Server Status:</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-zinc-400 font-bold">Online</span>
          </div>

          <div className="flex items-center gap-3">
            <SearchTrigger onOpen={() => {}} />
            <ThemeToggle />
          </div>
        </header>

        <main className={`flex-1 ${pathname === '/map' ? 'overflow-hidden' : 'p-8 overflow-y-auto'}`}>
          {children}
        </main>

        {/* Floating Agent Chatbox */}
        <AgentChatbox />
      </div>

      {/* Global Search Modal (self-managed via Ctrl+K) */}
      <GlobalSearch />
    </div>
  )
}
