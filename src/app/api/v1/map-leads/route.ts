import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const barangay = searchParams.get('barangay')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const whereClause: any = {}

    if (city && city !== 'ALL') {
      whereClause.city = { contains: city, mode: 'insensitive' }
    }
    if (barangay && barangay !== 'ALL') {
      whereClause.barangay = { contains: barangay, mode: 'insensitive' }
    }
    if (category && category !== 'ALL') {
      whereClause.businessCategory = { contains: category, mode: 'insensitive' }
    }
    if (status && status !== 'ALL') {
      whereClause.digitalPresence = {
        websiteStatus: status
      }
    }

    const businesses = await prisma.business.findMany({
      where: whereClause,
      include: {
        digitalPresence: true,
        contacts: true,
        opportunityAnalysis: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Default center for Cebu City coordinates if business latitude/longitude is missing
    const DEFAULT_CEBU_LAT = 10.3157
    const DEFAULT_CEBU_LNG = 123.8854

    const formattedLeads = businesses.map((b, index) => {
      // Deterministic slight offset for demo visualization if coordinates are null
      const lat = b.latitude ? Number(b.latitude) : DEFAULT_CEBU_LAT + ((index % 10) - 5) * 0.005
      const lng = b.longitude ? Number(b.longitude) : DEFAULT_CEBU_LNG + (Math.floor(index / 10) - 5) * 0.005

      return {
        id: b.id,
        name: b.name,
        category: b.businessCategory,
        barangay: b.barangay,
        city: b.city,
        lat,
        lng,
        websiteUrl: b.digitalPresence?.websiteUrl || null,
        websiteStatus: b.digitalPresence?.websiteStatus || 'NO_WEBSITE',
        facebookUrl: b.digitalPresence?.facebookUrl || null,
        contactsCount: b.contacts.length,
        leadScore: b.opportunityAnalysis?.leadScore || 50,
        primaryProblem: b.opportunityAnalysis?.primaryProblem || 'Missing Online Presence',
        recommendedOffer: b.opportunityAnalysis?.recommendedOffer || 'Mobile Responsive Website',
      }
    })

    return NextResponse.json({
      success: true,
      count: formattedLeads.length,
      leads: formattedLeads,
    })
  } catch (error: any) {
    console.error('Error fetching map leads:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
