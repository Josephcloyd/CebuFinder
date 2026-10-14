import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Next.js loads .env.development.local automatically, but the Prisma CLI does
// not. Load it first so local development can override an unavailable cloud URL.
config({ path: '.env.development.local' })
config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.LOCAL_DATABASE_URL ?? env('DATABASE_URL'),
  },
})
