'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Building2, MapPin, Sparkles, ArrowRight, Command } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  category: string
  barangay: string
  city: string
  leadScore: number
  primaryProblem: string
  websiteStatus: string
}

const statusColors: Record<string, string> = {
  FULLY_FUNCTIONAL: 'text-emerald-400',
  FACEBOOK_ONLY: 'text-amber-400',
  OUTDATED_SITE: 'text-amber-400',
  NO_WEBSITE: 'text-red-400',
  BROKEN_SITE: 'text-red-400',
  PARKED_DOMAIN: 'text-red-400',
}

const statusLabels: Record<string, string> = {
  FULLY_FUNCTIONAL: 'Functional',
  FACEBOOK_ONLY: 'Facebook only',
  OUTDATED_SITE: 'Outdated',
  NO_WEBSITE: 'No website',
  BROKEN_SITE: 'Broken',
  PARKED_DOMAIN: 'Parked',
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setResults([])
    setSelectedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }, [])

  const navigate = useCallback((result: SearchResult) => {
    router.push(`/businesses/${result.id}`)
    close()
  }, [router, close])

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        isOpen ? close() : open()
      }
      if (e.key === 'Escape' && isOpen) close()
    }
    const openHandler = () => open()
    window.addEventListener('keydown', handler)
    window.addEventListener('open-global-search', openHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('open-global-search', openHandler)
    }
  }, [isOpen, open, close])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.success) {
          setResults(data.results)
          setSelectedIndex(0)
        }
      } finally {
        setIsLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex])
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh]"
      style={{ background: 'rgba(37,42,44,0.34)', backdropFilter: 'blur(4px)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 24px 64px -18px rgba(37,42,44,0.32)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search businesses, barangays, categories..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          {isLoading && (
            <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          )}
          <button onClick={close} className="text-muted-foreground hover:text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((result, i) => (
              <button
                key={result.id}
                onClick={() => navigate(result)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all group ${
                  i === selectedIndex ? 'bg-primary/10' : 'hover:bg-secondary'
                } ${i < results.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                  i === selectedIndex
                    ? 'bg-primary/15 border-primary/40'
                    : 'bg-card border-border group-hover:border-border'
                }`}>
                  <Building2 className={`w-4 h-4 ${i === selectedIndex ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground truncate">{result.name}</span>
                    <span className={`text-[10px] font-bold flex-shrink-0 ${statusColors[result.websiteStatus] || 'text-muted-foreground'}`}>
                      {statusLabels[result.websiteStatus] || result.websiteStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">{result.barangay}, {result.city}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-[11px] text-muted-foreground">{result.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-primary" />
                      <span className="text-xs font-bold text-primary">{result.leadScore}</span>
                    </div>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 transition-opacity ${i === selectedIndex ? 'text-primary opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
                </div>
              </button>
            ))}
          </div>
        ) : query.length >= 2 && !isLoading ? (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">No businesses found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different name, barangay, or category</p>
          </div>
        ) : (
          <div className="px-4 py-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Quick Tips</p>
            <div className="space-y-2">
              {['Type a business name', 'Search by barangay (e.g. Lahug)', 'Search by category (e.g. Dental)'].map((tip) => (
                <div key={tip} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Search className="w-3 h-3 text-muted-foreground" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">↵</kbd> open</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">Esc</kbd> close</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Command className="w-2.5 h-2.5" />
            <span>K to open</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Trigger button for the header
export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open global search"
      className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="hidden sm:block">Search...</span>
      <span className="hidden sm:flex items-center gap-0.5 ml-1">
        <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">⌘K</kbd>
      </span>
    </button>
  )
}
