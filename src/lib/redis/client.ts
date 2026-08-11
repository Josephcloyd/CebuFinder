import { Queue } from 'bullmq'
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'

const globalForRedis = global as unknown as {
  redisConnection: Redis | undefined
  queues: Record<string, Queue> | undefined
  redisLoggedError: boolean | undefined
}

export const getRedisConnection = (): Redis => {
  if (!globalForRedis.redisConnection) {
    globalForRedis.redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      // Stop continuous aggressive retry loop if local Redis is offline
      retryStrategy(times) {
        if (times > 3) {
          // Stop retrying continuously when local Redis is offline
          return null
        }
        return Math.min(times * 300, 1000)
      },
    })
    
    globalForRedis.redisConnection.on('error', (err: any) => {
      // Log connection error only ONCE to prevent terminal log spamming
      if (!globalForRedis.redisLoggedError) {
        console.warn(`⚠️ [Redis] Connection failed to ${REDIS_URL} (${err.code || err.message}). App operating in local fallback mode.`)
        globalForRedis.redisLoggedError = true
      }
    })

    globalForRedis.redisConnection.on('connect', () => {
      console.log('✅ [Redis] Connected successfully.')
      globalForRedis.redisLoggedError = false
    })
  }
  return globalForRedis.redisConnection
}

const getQueue = (name: string): Queue => {
  if (!globalForRedis.queues) {
    globalForRedis.queues = {}
  }
  
  if (!globalForRedis.queues[name]) {
    const connection = getRedisConnection()
    globalForRedis.queues[name] = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s...
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    })
  }
  
  return globalForRedis.queues[name]
}

export const discoveryQueue = getQueue('discovery-queue')
export const auditQueue = getQueue('audit-queue')
export const aiAnalysisQueue = getQueue('ai-analysis-queue')
export const outreachQueue = getQueue('outreach-dispatch-queue')
