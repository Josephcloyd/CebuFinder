import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/redis/client'
import { DiscoveryRunnerService } from '../services/discovery-runner.service'
import { getErrorMessage } from '../lib/utils/errors'

const connection = getRedisConnection()

export const discoveryWorker = new Worker(
  'discovery-queue',
  async (job) => {
    const { scanId, category, barangay, city } = job.data
    console.log(`[Discovery Worker] Starting search for Category: "${category}" in City: "${city || 'Cebu City'}" (Barangay: "${barangay || 'All'}")`)

    try {
      const stats = await DiscoveryRunnerService.run({ scanId, category, barangay, city })
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
