'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  MapPin,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  TriangleAlert,
  Trash2,
} from 'lucide-react'
import { formatBusinessAgeWithYear } from '../../../lib/utils/business-age'
import { ExportLeadsButton } from '../../../components/export-leads-button'

interface DiscoveredBusiness {
  id: string
  name: string
  businessCategory: string
  barangay: string
  city: string
  province: string
  discoverySource: string
  dateDiscovered: string
  establishedYear: number | null
  establishedYearSource: string | null
  digitalPresence: {
    websiteStatus: string
    websiteUrl: string | null
    facebookUrl: string | null
  } | null
  contacts: Array<{ id: string; contactType: string; contactValue: string }>
  opportunityAnalysis: { leadScore: number } | null
}

const BUSINESSES_PER_PAGE = 9

function getEmailContacts(business: DiscoveredBusiness) {
  return business.contacts.filter((contact) => contact.contactType === 'BUSINESS_EMAIL' && contact.contactValue)
}

const WEBSITE_STATUS: Record<string, { label: string; className: string }> = {
  FULLY_FUNCTIONAL: { label: 'Website active', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  FACEBOOK_ONLY: { label: 'Facebook only', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  OUTDATED_SITE: { label: 'Outdated website', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  NO_WEBSITE: { label: 'No website', className: 'border-red-200 bg-red-50 text-red-700' },
  BROKEN_SITE: { label: 'Broken website', className: 'border-red-200 bg-red-50 text-red-700' },
  PARKED_DOMAIN: { label: 'Parked domain', className: 'border-red-200 bg-red-50 text-red-700' },
}

function formatSource(source: string) {
  return source
    .replace('OSM_OVERPASS', 'OpenStreetMap')
    .replace('GOOGLE_SEARCH_API', 'Google Search')
    .replace('BING_SEARCH_API', 'Bing Search')
    .replace('MANUAL_ENTRY', 'Manual entry')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DiscoveredBusinessesPage() {
  const [businesses, setBusinesses] = useState<DiscoveredBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [activeView, setActiveView] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [businessToDelete, setBusinessToDelete] = useState<DiscoveredBusiness | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeduplicating, setIsDeduplicating] = useState(false)
  const [dedupStatus, setDedupStatus] = useState('')
  const latestLoadId = useRef(0)

  const loadBusinesses = async () => {
    const loadId = ++latestLoadId.current
    setIsLoading(true)
    setError('')
    try {
      let lastError = 'Unable to load discovered businesses'

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const response = await fetch('/api/v1/leads', { cache: 'no-store' })
        const data = await response.json()

        if (response.ok && data.success) {
          if (loadId === latestLoadId.current) {
            setBusinesses(data.leads)
            setError('')
          }
          return
        }

        lastError = data.error || lastError
        if (response.status < 500 || attempt === 3) throw new Error(lastError)
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 200))
      }
    } catch (loadError) {
      if (loadId === latestLoadId.current) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load discovered businesses')
      }
    } finally {
      if (loadId === latestLoadId.current) setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBusinesses()
  }, [])

  const categories = useMemo(() => [...new Set(businesses.map((business) => business.businessCategory).filter(Boolean))].sort(), [businesses])

  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return businesses
      .filter((business) => {
        const matchesSearch = !normalizedQuery || [business.name, business.businessCategory, business.barangay, business.city]
          .some((value) => value?.toLowerCase().includes(normalizedQuery))
        const matchesCategory = !category || business.businessCategory === category
        const websiteStatus = business.digitalPresence?.websiteStatus || 'NO_WEBSITE'
        const matchesView = !activeView
          || (activeView === 'priority' && business.contacts.length > 0)
          || (activeView === 'missing-contacts' && business.contacts.length === 0)
          || (activeView === 'has-email' && getEmailContacts(business).length > 0)
          || (activeView === 'has-website' && websiteStatus === 'FULLY_FUNCTIONAL')
          || (activeView === 'outdated-website' && websiteStatus === 'OUTDATED_SITE')
        return matchesSearch && matchesCategory && matchesView
      })
      .sort((a, b) => new Date(b.dateDiscovered).getTime() - new Date(a.dateDiscovered).getTime())
  }, [activeView, businesses, category, query])

  const totalPages = Math.max(1, Math.ceil(filteredBusinesses.length / BUSINESSES_PER_PAGE))
  const pageStart = (currentPage - 1) * BUSINESSES_PER_PAGE
  const paginatedBusinesses = filteredBusinesses.slice(pageStart, pageStart + BUSINESSES_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeView, category, query])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const deleteBusiness = async () => {
    if (!businessToDelete) return

    setIsDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/v1/leads/${businessToDelete.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to delete this business')

      setBusinesses((current) => current.filter((business) => business.id !== businessToDelete.id))
      setBusinessToDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this business')
    } finally {
      setIsDeleting(false)
    }
  }

  const cleanDuplicates = async () => {
    setIsDeduplicating(true)
    setDedupStatus('')
    setError('')

    try {
      const response = await fetch('/api/v1/leads/deduplicate', { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to clean duplicate businesses')

      setDedupStatus(data.message || 'Duplicate cleanup completed.')
      await loadBusinesses()
    } catch (dedupError) {
      setError(dedupError instanceof Error ? dedupError.message : 'Unable to clean duplicate businesses')
    } finally {
      setIsDeduplicating(false)
    }
  }

  const leadViews = [
    { id: 'priority', label: 'Priority leads', subtitle: 'With contact details', icon: Star },
    { id: 'missing-contacts', label: 'Missing contacts', subtitle: 'Needs research', icon: AlertTriangle },
    { id: 'has-email', label: 'Has email', subtitle: 'Ready for email outreach', icon: Mail },
    { id: 'has-website', label: 'Has website', subtitle: 'Active and functional', icon: Globe2 },
    { id: 'outdated-website', label: 'Outdated website', subtitle: 'Needs an upgrade', icon: Clock3 },
  ]

  const exportHasContacts = activeView === 'priority' ? true : activeView === 'missing-contacts' ? false : undefined
  const exportWebsiteStatus = activeView === 'has-website' ? 'FULLY_FUNCTIONAL' : activeView === 'outdated-website' ? 'OUTDATED_SITE' : undefined

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-2" aria-label="Business catalog toolbar">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 overflow-x-auto">
            {leadViews.map((view) => {
              const Icon = view.icon
              const isActive = activeView === view.id
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView((current) => current === view.id ? '' : view.id)}
                  aria-pressed={isActive}
                  title={isActive ? 'Click again to clear this view' : view.subtitle}
                  className={`flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-left">
                    <span className="block">{view.label}</span>
                    <span className="hidden text-[10px] font-normal text-muted-foreground sm:block">{view.subtitle}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 xl:flex-shrink-0 xl:border-l xl:border-t-0 xl:pl-2 xl:pt-0">
            <ExportLeadsButton
              hasContacts={exportHasContacts}
              category={category}
              status={exportWebsiteStatus}
              onlyWithEmail={activeView === 'has-email'}
            />
            <button
              onClick={cleanDuplicates}
              disabled={isDeduplicating || isLoading}
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              title="Remove duplicate businesses that have the same name and barangay"
            >
              {isDeduplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
              {isDeduplicating ? 'Cleaning…' : 'Clean duplicates'}
            </button>
            <button
              onClick={loadBusinesses}
              disabled={isLoading}
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <TriangleAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {dedupStatus && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          <CheckCircle2 className="h-4 w-4" /> {dedupStatus}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(240px,1fr)_256px]">
            <label className="relative sm:self-end">
              <span className="sr-only">Search discovered businesses</span>
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or location…"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <div>
            <label htmlFor="business-category" className="mb-1.5 block text-xs font-medium text-foreground">Business category</label>
              <select id="business-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
                <option value="">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredBusinesses.length ? pageStart + 1 : 0}–{Math.min(pageStart + BUSINESSES_PER_PAGE, filteredBusinesses.length)}</span> of {filteredBusinesses.length} matching businesses
          </p>
        </div>
      </section>

      {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          Loading discovered businesses…
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Building2 className="mx-auto h-7 w-7 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">No businesses found in this category</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose another category or run a discovery scan.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Discovered business results">
            {paginatedBusinesses.map((business) => {
              const website = WEBSITE_STATUS[business.digitalPresence?.websiteStatus || 'NO_WEBSITE'] || WEBSITE_STATUS.NO_WEBSITE
              const emails = getEmailContacts(business)
              return (
                <article key={business.id} className="group flex min-h-64 flex-col rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_10px_30px_rgba(52,62,58,0.07)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-primary">
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-foreground" title={business.name}>{business.name}</h2>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{business.businessCategory}</p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1">
                      {emails.length > 0 && (
                        <span className="flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[9px] font-semibold text-sky-800" title="This business has an email address">
                          <Mail className="h-2.5 w-2.5" /> Email
                        </span>
                      )}
                      <span className={`rounded-md border px-2 py-1 text-[9px] font-semibold ${website.className}`}>{website.label}</span>
                    </div>
                    {business.opportunityAnalysis && (
                      <span className="text-[10px] font-semibold text-primary">Lead score {business.opportunityAnalysis.leadScore}</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Business age</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-foreground">{formatBusinessAgeWithYear(business.establishedYear)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Discovered</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-foreground">{formatDate(business.dateDiscovered)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> {business.barangay}, {business.city}</p>
                  <p className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-primary" /> Found via {formatSource(business.discoverySource)}</p>
                  {emails.length > 0 && (
                    <p className="flex min-w-0 items-center gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      <a href={`mailto:${emails[0].contactValue}`} className="truncate text-foreground hover:text-primary hover:underline" title={emails.map((email) => email.contactValue).join(', ')}>
                        {emails[0].contactValue}
                      </a>
                      {emails.length > 1 && <span className="flex-shrink-0 text-[10px]">+{emails.length - 1} more</span>}
                    </p>
                  )}
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {business.contacts.length ? `${business.contacts.length} contact${business.contacts.length === 1 ? '' : 's'} available` : 'No contact recorded yet'}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-[10px] text-muted-foreground">{business.establishedYearSource || 'Age source unavailable'}</span>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBusinessToDelete(business)}
                      aria-label={`Delete ${business.name}`}
                      title={`Delete ${business.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/businesses/${business.id}`} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-secondary">
                      Open profile <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
              )
            })}
          </section>

          {totalPages > 1 && (
            <nav className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row" aria-label="Business catalog pagination">
              <p className="text-xs text-muted-foreground">Page <span className="font-semibold text-foreground">{currentPage}</span> of {totalPages}</p>
              <div className="flex max-w-full items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${currentPage === page ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </nav>
          )}
        </div>
      )}

      {businessToDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-business-title"
          onClick={() => !isDeleting && setBusinessToDelete(null)}
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 id="delete-business-title" className="mt-4 text-lg font-semibold text-foreground">Delete this business?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-semibold text-foreground">{businessToDelete.name}</span> and its contacts, audit information, opportunity analysis, and outreach history will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setBusinessToDelete(null)}
                disabled={isDeleting}
                className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteBusiness}
                disabled={isDeleting}
                className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
