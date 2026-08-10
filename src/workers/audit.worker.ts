import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/redis/client'
import { AuditorService } from '../services/auditor.service'

const connection = getRedisConnection()

export const auditWorker = new Worker(
  'audit-queue',
  async (job) => {
    const { businessId } = job.data
    console.log(`[Audit Worker] Auditing website for business: ${businessId}`)
    
    try {
      const results = await AuditorService.auditBusiness(businessId)
      console.log(`[Audit Worker] Successfully audited business ${businessId}. Status: ${results.websiteStatus}`)
      return results
    } catch (err: any) {
      console.error(`[Audit Worker] Failed to audit business ${businessId}:`, err.message)
      throw err
    }
  },
  { connection, concurrency: 5 }
)

auditWorker.on('failed', (job, err) => {
  console.error(`[Audit Worker] Job ${job?.id} failed:`, err.message)
})
