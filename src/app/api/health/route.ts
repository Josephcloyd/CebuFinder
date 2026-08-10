import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRedisConnection } from '@/lib/redis/client'

// Force dynamic execution for this route so that Next.js doesn't cache the response
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 3000 // 3 seconds timeout

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Operation timed out'))
    }, timeoutMs)
  })
  
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const uptime = process.uptime()
  
  const services: Record<string, { status: 'up' | 'down'; latencyMs?: number; error?: string }> = {}
  let overallHealthy = true

  // 1. Check Database (Prisma/PostgreSQL)
  const dbStart = performance.now()
  try {
    // Run a simple raw query to verify database connection viability
    await withTimeout(prisma.$queryRaw`SELECT 1`, TIMEOUT_MS)
    services.database = {
      status: 'up',
      latencyMs: Math.round(performance.now() - dbStart)
    }
  } catch (err: any) {
    overallHealthy = false
    services.database = {
      status: 'down',
      error: err.message || String(err)
    }
  }

  // 2. Check Redis
  const redisStart = performance.now()
  try {
    const redis = getRedisConnection()
    await withTimeout(redis.ping(), TIMEOUT_MS)
    services.redis = {
      status: 'up',
      latencyMs: Math.round(performance.now() - redisStart)
    }
  } catch (err: any) {
    overallHealthy = false
    services.redis = {
      status: 'down',
      error: err.message || String(err)
    }
  }

  // 3. Check Configuration Status (critical keys only verify existence, not values)
  const config = {
    databaseUrlConfigured: !!process.env.DATABASE_URL,
    redisUrlConfigured: !!process.env.REDIS_URL,
    resendApiKeyConfigured: !!process.env.RESEND_API_KEY,
    anthropicApiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
  }

  // 4. System statistics
  const memoryUsage = process.memoryUsage()
  const system = {
    memoryUsage: {
      rss: `${Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100} MB`,
      heapTotal: `${Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100} MB`,
      heapUsed: `${Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100} MB`,
      external: `${Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100} MB`,
    },
    nodeVersion: process.version,
    platform: process.platform,
  }

  const responseBody = {
    status: overallHealthy ? 'healthy' : 'unhealthy',
    timestamp,
    uptime,
    services,
    config,
    system,
  }

  const status = overallHealthy ? 200 : 503

  return NextResponse.json(responseBody, { status })
}
