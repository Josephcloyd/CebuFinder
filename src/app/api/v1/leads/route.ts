import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barangay = searchParams.get('barangay')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const minScore = searchParams.get('minScore')
  const query = searchParams.get('query')

  try {
    const where: any = {}

    if (barangay) {
      where.barangay = { equals: barangay, mode: 'insensitive' }
    }
    if (category) {
      where.businessCategory = { equals: category, mode: 'insensitive' }
    }
    if (query) {
      where.name = { contains: query, mode: 'insensitive' }
    }

    // Filter by digital presence or outreach status if needed
    if (status) {
      where.outreach = {
        some: { status: status as any }
      }
    }

    if (minScore) {
      const score = parseInt(minScore, 10)
      if (!isNaN(score)) {
        where.opportunityAnalysis = {
          leadScore: { gte: score }
        }
      }
    }

    const leads = await prisma.business.findMany({
      where,
      include: {
        digitalPresence: true,
        opportunityAnalysis: true,
        contacts: true,
        outreach: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { dateDiscovered: 'desc' },
      take: 100 // Cap for performance
    })

    return NextResponse.json({ success: true, count: leads.length, leads })
  } catch (error: any) {
    console.error('Error fetching leads:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
