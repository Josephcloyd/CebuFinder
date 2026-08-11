import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const barangay = searchParams.get('barangay')
    const query = searchParams.get('query')

    const whereClause: any = {}

    if (category && category !== 'ALL') {
      whereClause.businessCategory = { contains: category, mode: 'insensitive' }
    }
    if (barangay && barangay !== 'ALL') {
      whereClause.barangay = { contains: barangay, mode: 'insensitive' }
    }
    if (query) {
      whereClause.name = { contains: query, mode: 'insensitive' }
    }

    const businesses = await prisma.business.findMany({
      where: whereClause,
      include: {
        digitalPresence: true,
        contacts: true,
        opportunityAnalysis: true,
        outreach: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const columns = {
      DISCOVERED: [] as any[],
      AUDITED: [] as any[],
      PITCH_DRAFTED: [] as any[],
      CONTACTED: [] as any[],
      CONVERTED: [] as any[],
    }

    businesses.forEach((b) => {
      const latestOutreach = b.outreach[0]
      const status = latestOutreach?.status

      const formatted = {
        id: b.id,
        name: b.name,
        category: b.businessCategory,
        barangay: b.barangay,
        city: b.city,
        websiteStatus: b.digitalPresence?.websiteStatus || 'NO_WEBSITE',
        websiteUrl: b.digitalPresence?.websiteUrl || null,
        contactsCount: b.contacts.length,
        hasEmail: b.contacts.some((c) => c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@')),
        leadScore: b.opportunityAnalysis?.leadScore || 50,
        primaryProblem: b.opportunityAnalysis?.primaryProblem || 'Missing Online Presence',
        recommendedOffer: b.opportunityAnalysis?.recommendedOffer || 'Mobile Responsive Website',
        outreachStatus: status || 'NONE',
        outreachId: latestOutreach?.id || null,
      }

      if (status === 'REPLIED') {
        columns.CONVERTED.push(formatted)
      } else if (status === 'SENT' || status === 'QUEUED' || status === 'APPROVED') {
        columns.CONTACTED.push(formatted)
      } else if (status === 'PENDING_APPROVAL' || status === 'DRAFTED') {
        columns.PITCH_DRAFTED.push(formatted)
      } else if (b.opportunityAnalysis) {
        columns.AUDITED.push(formatted)
      } else {
        columns.DISCOVERED.push(formatted)
      }
    })

    return NextResponse.json({
      success: true,
      totalCount: businesses.length,
      columns,
    })
  } catch (error: any) {
    console.error('Error fetching pipeline data:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, targetStage } = body

    if (!businessId || !targetStage) {
      return NextResponse.json({ success: false, error: 'businessId and targetStage are required.' }, { status: 400 })
    }

    let outreachStatus: any = 'DRAFTED'
    if (targetStage === 'PITCH_DRAFTED') outreachStatus = 'PENDING_APPROVAL'
    if (targetStage === 'CONTACTED') outreachStatus = 'SENT'
    if (targetStage === 'CONVERTED') outreachStatus = 'REPLIED'

    const existingOutreach = await prisma.outreach.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    })

    if (existingOutreach) {
      await prisma.outreach.update({
        where: { id: existingOutreach.id },
        data: { status: outreachStatus },
      })
    } else {
      await prisma.outreach.create({
        data: {
          businessId,
          subject: 'Outreach Proposal',
          messageBody: 'Drafted pitch',
          status: outreachStatus,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Lead stage updated to ${targetStage}`,
    })
  } catch (error: any) {
    console.error('Error updating lead stage:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
