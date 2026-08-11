import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: [] })
    }

    const results = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { normalizedName: { contains: q, mode: 'insensitive' } },
          { businessCategory: { contains: q, mode: 'insensitive' } },
          { barangay: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        opportunityAnalysis: {
          select: { leadScore: true, primaryProblem: true },
        },
        digitalPresence: {
          select: { websiteStatus: true },
        },
      },
      take: 10,
      orderBy: [
        { opportunityAnalysis: { leadScore: 'desc' } },
        { createdAt: 'desc' },
      ],
    })

    const formatted = results.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.businessCategory,
      barangay: b.barangay,
      city: b.city,
      leadScore: b.opportunityAnalysis?.leadScore ?? 0,
      primaryProblem: b.opportunityAnalysis?.primaryProblem ?? '',
      websiteStatus: b.digitalPresence?.websiteStatus ?? 'NO_WEBSITE',
    }))

    return NextResponse.json({ success: true, results: formatted })
  } catch (error: any) {
    console.error('Search error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
