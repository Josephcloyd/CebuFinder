import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/redis/client'
import { DiscoveryService, DiscoveredBusiness } from '../services/discovery.service'
import { SearchService } from '../services/search.service'
import { IngestionService } from '../services/ingestion.service'
import { normalizeBusinessName } from '../lib/utils/text-normalizer'
import { getErrorMessage } from '../lib/utils/errors'

const connection = getRedisConnection()

export const discoveryWorker = new Worker(
  'discovery-queue',
  async (job) => {
    const { category, barangay, city } = job.data
    console.log(`[Discovery Worker] Starting search for Category: "${category}" in City: "${city || 'Cebu City'}" (Barangay: "${barangay || 'All'}")`)

    try {
      // 1. Run OSM Overpass search
      const osmLeads = await DiscoveryService.discoverFromOSM(category, barangay, city)
      console.log(`[Discovery Worker] OSM returned ${osmLeads.length} raw leads.`)

      // 2. Run Google Custom Search fallback
      const searchLeads = await SearchService.searchGoogle(category, barangay, city)
      console.log(`[Discovery Worker] Search Engine API returned ${searchLeads.length} raw leads.`)

      // 3. Simple In-Memory Merge by normalized name
      const mergedLeadsMap = new Map<string, DiscoveredBusiness>()

      // Add OSM leads first
      for (const lead of osmLeads) {
        const key = normalizeBusinessName(lead.name)
        mergedLeadsMap.set(key, lead)
      }

      // Merge Google Search leads
      for (const lead of searchLeads) {
        const key = normalizeBusinessName(lead.name)
        const existing = mergedLeadsMap.get(key)
        
        if (existing) {
          // Enrich existing OSM record with search URLs/socials if they were missing
          if (!existing.websiteUrl && lead.websiteUrl) {
            existing.websiteUrl = lead.websiteUrl
          }
          if (!existing.facebookUrl && lead.facebookUrl) {
            existing.facebookUrl = lead.facebookUrl
          }
        } else {
          mergedLeadsMap.set(key, lead)
        }
      }

      const uniqueLeads = Array.from(mergedLeadsMap.values())
      console.log(`[Discovery Worker] Merged down to ${uniqueLeads.length} unique leads. Ingesting...`)

      // 4. Ingest leads into DB (triggers audit pipeline automatically)
      const stats = await IngestionService.ingestBusinesses(uniqueLeads)
      console.log(`[Discovery Worker] Ingestion finished. Added: ${stats.added}, Updated: ${stats.updated}, Suppressed: ${stats.duplicatesSkipped}`)
      
      return stats
    } catch (err: unknown) {
      console.error(`[Discovery Worker] Error executing discovery for "${category}" in "${barangay}":`, getErrorMessage(err))
      throw err
    }
  },
  { connection, concurrency: 1 } // Rate-limited to respect API terms of service
)

discoveryWorker.on('failed', (job, err) => {
  console.error(`[Discovery Worker] Job ${job?.id} failed:`, err.message)
})
