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
  FULLY_FUNCTIONAL: '🟢 Functional',
  FACEBOOK_ONLY: '🟡 FB Only',
  OUTDATED_SITE: '🟡 Outdated',
  NO_WEBSITE: '🔴 No Website',
  BROKEN_SITE: '🔴 Broken',
  PARKED_DOMAIN: '🔴 Parked',
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
    router.push(`/leads/${result.id}`)
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
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 25px 80px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(168,85,247,0.1)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80">
          <Search className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search businesses, barangays, categories..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
          />
          {isLoading && (
            <div className="w-4 h-4 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin flex-shrink-0" />
          )}
          <button onClick={close} className="text-zinc-600 hover:text-zinc-400 transition-colors">
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
                  i === selectedIndex ? 'bg-purple-500/10' : 'hover:bg-zinc-900/50'
                } ${i < results.length - 1 ? 'border-b border-zinc-900/60' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                  i === selectedIndex
                    ? 'bg-purple-500/20 border-purple-500/30'
                    : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-700'
                }`}>
                  <Building2 className={`w-4 h-4 ${i === selectedIndex ? 'text-purple-400' : 'text-zinc-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{result.name}</span>
                    <span className={`text-[10px] font-bold flex-shrink-0 ${statusColors[result.websiteStatus] || 'text-zinc-400'}`}>
                      {statusLabels[result.websiteStatus] || result.websiteStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-zinc-600 flex-shrink-0" />
                    <span className="text-[11px] text-zinc-500 truncate">{result.barangay}, {result.city}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-[11px] text-zinc-500">{result.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                      <span className="text-xs font-bold text-purple-400">{result.leadScore}</span>
                    </div>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 transition-opacity ${i === selectedIndex ? 'text-purple-400 opacity-100' : 'text-zinc-700 opacity-0 group-hover:opacity-100'}`} />
                </div>
              </button>
            ))}
          </div>
        ) : query.length >= 2 && !isLoading ? (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 font-semibold">No businesses found</p>
            <p className="text-xs text-zinc-600 mt-1">Try a different name, barangay, or category</p>
          </div>
        ) : (
          <div className="px-4 py-5">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Quick Tips</p>
            <div className="space-y-2">
              {['Type a business name', 'Search by barangay (e.g. Lahug)', 'Search by category (e.g. Dental)'].map((tip) => (
                <div key={tip} className="flex items-center gap-2.5 text-xs text-zinc-500">
                  <Search className="w-3 h-3 text-zinc-700" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">↵</kbd> open</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px]">Esc</kbd> close</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-700">
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-all group"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="hidden sm:block">Search...</span>
      <span className="hidden sm:flex items-center gap-0.5 ml-1">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 group-hover:bg-zinc-700 rounded text-[9px] font-bold text-zinc-600 transition-colors">⌘K</kbd>
      </span>
    </button>
  )
}
