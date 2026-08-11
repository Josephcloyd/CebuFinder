import { NextResponse } from 'next/server'
import { discoveryQueue } from '../../../../lib/redis/client'
import { getErrorMessage } from '../../../../lib/utils/errors'

const globalForDiscovery = globalThis as typeof globalThis & {
  activeDiscoveryJobs?: Set<string>
}

const activeDiscoveryJobs = globalForDiscovery.activeDiscoveryJobs ?? new Set<string>()
globalForDiscovery.activeDiscoveryJobs = activeDiscoveryJobs

function normalizeBarangay(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  const normalized = trimmed.toLowerCase()
  if (
    !trimmed ||
    ['all', 'all barangays', 'city-wide'].includes(normalized) ||
    normalized.startsWith('all barangays in ')
  ) {
    return undefined
  }

  return trimmed
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const city = typeof body.city === 'string' && body.city.trim() ? body.city.trim() : 'Cebu City'
    const barangay = normalizeBarangay(body.barangay)

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required.' }, { status: 400 })
    }

    const scope = barangay || 'city-wide'
    const jobKey = `${category}-${city}-${scope}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    if (activeDiscoveryJobs.has(jobKey)) {
      return NextResponse.json({
        success: true,
        alreadyRunning: true,
        message: `A discovery campaign for ${category} in ${city} (Barangay: ${barangay || 'All'}) is already running.`,
        jobId: `inline-${jobKey}`,
      }, { status: 202 })
    }

    activeDiscoveryJobs.add(jobKey)

    // Queue the discovery job
    let jobId = 'inline-job'
    try {
      const job = await discoveryQueue.add(`discover-${category}-${city}-${barangay || 'all'}`, {
        category,
        barangay,
        city,
      }, {
        // Deduplicate repeat submissions in the same five-minute window.
        jobId: `${jobKey}-${Math.floor(Date.now() / 300000)}`,
      })
      jobId = job.id || 'queued'
      activeDiscoveryJobs.delete(jobKey)
    } catch (redisErr: unknown) {
      console.warn('Redis queue offline, running discovery inline in background:', getErrorMessage(redisErr))

      // Run in background without awaiting to avoid blocking the HTTP response
      void Promise.resolve().then(async () => {
        try {
          const { DiscoveryService } = await import('../../../../services/discovery.service')
          const { SearchService } = await import('../../../../services/search.service')
          const { IngestionService } = await import('../../../../services/ingestion.service')
          console.log(`[Inline Discovery] Starting background search for ${category} in ${city} (Barangay: ${barangay || 'All'})...`)

          let rawLeads = await DiscoveryService.discoverFromOSM(category, barangay, city).catch((err) => {
            console.warn(`[Inline Discovery] OSM warning: ${err.message}. Trying search engine fallback...`)
            return []
          })

          if (!rawLeads || rawLeads.length === 0) {
            console.log('[Inline Discovery] OSM returned 0 leads. Falling back to Search Engine API...')
            rawLeads = await SearchService.searchGoogle(category, barangay, city)
          }

          console.log(`[Inline Discovery] Discovered ${rawLeads.length} leads. Ingesting...`)
          const ingestResult = await IngestionService.ingestBusinesses(rawLeads)
          console.log(`[Inline Discovery] Ingestion finished:`, ingestResult)
        } catch (discErr: unknown) {
          console.error('[Inline Discovery] Background task failed:', getErrorMessage(discErr))
        } finally {
          activeDiscoveryJobs.delete(jobKey)
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Triggered discovery campaign for ${category} in ${city} (Barangay: ${barangay || 'All'})`,
      jobId: jobId,
    })
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('Error triggering discovery:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
