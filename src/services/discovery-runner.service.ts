import { prisma } from '../lib/db'
import { getErrorMessage } from '../lib/utils/errors'
import { normalizeBusinessName } from '../lib/utils/text-normalizer'
import { DiscoveryService, type DiscoveredBusiness } from './discovery.service'
import { IngestionService } from './ingestion.service'
import { SearchService } from './search.service'

interface DiscoveryRunInput {
  scanId: string
  category: string
  barangay?: string
  city: string
}

async function updateScan(scanId: string, data: Record<string, unknown>) {
  try {
    await prisma.discoveryScan.update({ where: { id: scanId }, data })
  } catch (error) {
    console.error(`[Discovery] Could not update scan ${scanId}:`, getErrorMessage(error))
  }
}

export class DiscoveryRunnerService {
  static async run({ scanId, category, barangay, city }: DiscoveryRunInput) {
    await updateScan(scanId, {
      status: 'SEARCHING',
      message: 'Searching public business listings…',
      startedAt: new Date(),
      error: null,
    })

    try {
      const osmLeads = await DiscoveryService.discoverFromOSM(category, barangay, city).catch((error) => {
        console.warn('[Discovery] OpenStreetMap search warning:', getErrorMessage(error))
        return []
      })

      const searchLeads = await SearchService.searchGoogle(category, barangay, city).catch((error) => {
        console.warn('[Discovery] Search engine warning:', getErrorMessage(error))
        return []
      })

      const mergedLeads = new Map<string, DiscoveredBusiness>()
      for (const lead of osmLeads) mergedLeads.set(normalizeBusinessName(lead.name), lead)

      for (const lead of searchLeads) {
        const key = normalizeBusinessName(lead.name)
        const existing = mergedLeads.get(key)
        if (!existing) {
          mergedLeads.set(key, lead)
          continue
        }

        existing.websiteUrl ||= lead.websiteUrl
        existing.facebookUrl ||= lead.facebookUrl
        existing.phone ||= lead.phone
        existing.establishedYear ||= lead.establishedYear
        existing.establishedYearSource ||= lead.establishedYearSource
      }

      const uniqueLeads = [...mergedLeads.values()]
      await updateScan(scanId, {
        status: 'PROCESSING',
        message: `Found ${uniqueLeads.length} public listing${uniqueLeads.length === 1 ? '' : 's'}. Saving and checking duplicates…`,
        foundCount: uniqueLeads.length,
      })

      const stats = await IngestionService.ingestBusinesses(uniqueLeads)
      await updateScan(scanId, {
        status: 'COMPLETED',
        message: `Scan complete. ${stats.added} added, ${stats.updated} updated, ${stats.duplicatesSkipped} skipped.`,
        foundCount: uniqueLeads.length,
        addedCount: stats.added,
        updatedCount: stats.updated,
        skippedCount: stats.duplicatesSkipped,
        completedAt: new Date(),
      })

      return stats
    } catch (error) {
      const message = getErrorMessage(error)
      await updateScan(scanId, {
        status: 'FAILED',
        message: 'The scan could not be completed.',
        error: message,
        completedAt: new Date(),
      })
      throw error
    }
  }
}
