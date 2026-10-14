'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface ActiveScan {
  id: string
  category: string
  city: string
  status: 'QUEUED' | 'SEARCHING' | 'PROCESSING'
}

const ACTIVE_STATUSES = ['QUEUED', 'SEARCHING', 'PROCESSING']

export function DiscoveryActivityIndicator() {
  const [activeScan, setActiveScan] = useState<ActiveScan | null>(null)

  const checkForActiveScan = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/discovery?limit=5', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.success) return

      const running = data.scans.find((scan: ActiveScan) => ACTIVE_STATUSES.includes(scan.status))
      setActiveScan(running || null)
    } catch {
      // A temporary status-check failure must not affect page navigation.
    }
  }, [])

  useEffect(() => {
    void checkForActiveScan()
    const interval = window.setInterval(checkForActiveScan, 3000)
    window.addEventListener('discovery-scan-started', checkForActiveScan)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('discovery-scan-started', checkForActiveScan)
    }
  }, [checkForActiveScan])

  if (!activeScan) return null

  return (
    <Link
      href="/discovery"
      className="flex h-9 items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary"
      title={`${activeScan.category} scan in ${activeScan.city}`}
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span className="hidden md:inline">Scan running</span>
    </Link>
  )
}
