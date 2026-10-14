import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { discoveryQueue } from '../../../../lib/redis/client'
import { getErrorMessage } from '../../../../lib/utils/errors'

function normalizeBarangay(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  const normalized = trimmed.toLowerCase()
  if (!trimmed || ['all', 'all barangays', 'city-wide'].includes(normalized) || normalized.startsWith('all barangays in ')) {
    return undefined
  }

  return trimmed
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedLimit = Number(searchParams.get('limit') || 5)
  const limit = Math.min(20, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 5))

  try {
    const scans = await prisma.discoveryScan.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ success: true, scans })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
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

    const recentCutoff = new Date(Date.now() - 15 * 60 * 1000)
    const existingScan = await prisma.discoveryScan.findFirst({
      where: {
        category,
        city,
        barangay: barangay ?? null,
        status: { in: ['QUEUED', 'SEARCHING', 'PROCESSING'] },
        createdAt: { gte: recentCutoff },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existingScan) {
      return NextResponse.json({
        success: true,
        alreadyRunning: true,
        message: existingScan.message,
        jobId: existingScan.id,
        scan: existingScan,
      }, { status: 202 })
    }

    const scan = await prisma.discoveryScan.create({
      data: {
        category,
        city,
        barangay,
        status: 'QUEUED',
        message: 'Scan queued. Waiting for the discovery service…',
      },
    })

    try {
      await discoveryQueue.add(`discover-${category}-${city}-${barangay || 'all'}`, {
        scanId: scan.id,
        category,
        barangay,
        city,
      }, {
        jobId: scan.id,
      })
    } catch (redisError) {
      console.warn('Redis queue offline, running discovery inline in background:', getErrorMessage(redisError))

      void Promise.resolve().then(async () => {
        try {
          const { DiscoveryRunnerService } = await import('../../../../services/discovery-runner.service')
          await DiscoveryRunnerService.run({ scanId: scan.id, category, barangay, city })
        } catch (error) {
          console.error('[Inline Discovery] Background task failed:', getErrorMessage(error))
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: scan.message,
      jobId: scan.id,
      scan,
    }, { status: 202 })
  } catch (error) {
    const message = getErrorMessage(error)
    console.error('Error triggering discovery:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
