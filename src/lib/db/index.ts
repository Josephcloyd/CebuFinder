import { PrismaClient } from '../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

const getDbClient = () => {
  // Prefer the developer-local database when configured. This lets local
  // development keep working even if a previously provisioned cloud database
  // has expired, while production continues to use DATABASE_URL.
  let connectionString = process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('LOCAL_DATABASE_URL or DATABASE_URL is not set in environment variables.')
  }

  // If it's a prisma+postgres protocol, extract the underlying postgres:// URL from the api_key parameter
  if (connectionString.startsWith('prisma+postgres://')) {
    try {
      const url = new URL(connectionString)
      const apiKey = url.searchParams.get('api_key')
      if (apiKey) {
        // Base64 decode the api_key to find the databaseUrl JSON
        const decoded = Buffer.from(apiKey, 'base64').toString('utf-8')
        const parsed = JSON.parse(decoded)
        if (parsed.databaseUrl) {
          connectionString = parsed.databaseUrl
        }
      }
    } catch (err: any) {
      console.warn('Failed to parse prisma+postgres URL, using original:', err.message)
    }
  }

  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? getDbClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
