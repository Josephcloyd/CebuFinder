'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Columns3,
  Inbox,
  Map,
  Menu,
  Radar,
  Search,
  ShieldAlert,
  UserRoundX,
  X,
} from 'lucide-react'
import { AgentChatbox } from '../../components/agent-chatbox'
import { ThemeToggle } from '../../components/theme-toggle'
import { GlobalSearch, SearchTrigger } from '../../components/global-search'
import { DiscoveryActivityIndicator } from '../../components/discovery-activity-indicator'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    label: 'Workspace',
    items: [
      { href: '/', label: 'Overview', icon: BarChart3 },
      { href: '/businesses', label: 'Discovered businesses', icon: Building2 },
      { href: '/map', label: 'Map explorer', icon: Map },
      { href: '/pipeline', label: 'Sales pipeline', icon: Columns3 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/discovery', label: 'Discover businesses', icon: Radar },
      { href: '/approval', label: 'Approval queue', icon: Inbox },
      { href: '/uncontactable', label: 'Missing contacts', icon: UserRoundX },
      { href: '/suppression', label: 'Suppression list', icon: ShieldAlert },
    ],
  },
]

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/businesses': 'Discovered businesses',
  '/map': 'Map explorer',
  '/pipeline': 'Sales pipeline',
  '/discovery': 'Business discovery',
  '/approval': 'Approval queue',
  '/uncontactable': 'Missing contacts',
  '/suppression': 'Suppression list',
}

export default function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [databaseOnline, setDatabaseOnline] = useState<boolean | null>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    let active = true
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => {
        if (active) setDatabaseOnline(data?.services?.database?.status === 'up')
      })
      .catch(() => {
        if (active) setDatabaseOnline(false)
      })
    return () => {
      active = false
    }
  }, [])

  const title = pathname.startsWith('/leads/') || pathname.startsWith('/businesses/') ? 'Business profile' : pageTitles[pathname] || 'Workspace'

  const sidebar = (
    <aside className="flex h-full w-[272px] flex-col border-r border-border bg-[var(--sidebar-bg)]">
      <div className="flex h-18 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          CD
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Cebu Digital Finder</p>
          <p className="text-xs text-muted-foreground">Business intelligence</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
        {navigation.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href
                  || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
                  || (item.href === '/businesses' && pathname.startsWith('/leads/'))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${
                      active
                        ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(37,42,44,0.04)]'
                        : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-[17px] w-[17px] ${active ? 'text-primary' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
          <span className={`h-2 w-2 rounded-full ${databaseOnline ? 'bg-emerald-600' : databaseOnline === false ? 'bg-red-500' : 'bg-stone-400'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground">
              {databaseOnline ? 'Database connected' : databaseOnline === false ? 'Database unavailable' : 'Checking connection'}
            </p>
            <p className="text-[11px] text-muted-foreground">Local workspace</p>
          </div>
          {databaseOnline && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        </div>
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ddd7ca] text-xs font-semibold text-[#4b514e]">
            CD
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">Cebu operations</p>
            <p className="text-[11px] text-muted-foreground">Private workspace</p>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[min(86vw,272px)]">
            {sidebar}
            <button
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-[var(--header-bg)] px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Cebu business development workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DiscoveryActivityIndicator />
            <SearchTrigger onOpen={() => window.dispatchEvent(new Event('open-global-search'))} />
            <ThemeToggle />
            <Link
              href="/discovery"
              className="hidden h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[#355448] sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              Find businesses
            </Link>
          </div>
        </header>

        <main className={pathname === '/map' ? 'min-h-[calc(100vh-4rem)] overflow-hidden' : 'mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8'}>
          {children}
        </main>
      </div>

      <AgentChatbox />
      <GlobalSearch />
    </div>
  )
}
