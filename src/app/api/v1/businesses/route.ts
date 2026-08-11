import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

// POST /api/v1/businesses — Manual business entry from the Discovery page
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, businessCategory, barangay, city, latitude, longitude, discoverySource } = body

    if (!name || !businessCategory || !barangay) {
      return NextResponse.json({ success: false, error: 'name, businessCategory, and barangay are required' }, { status: 400 })
    }

    const existing = await prisma.business.findFirst({
      where: { normalizedName: name.toLowerCase().trim(), barangay },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'A business with this name already exists in this barangay' }, { status: 409 })
    }

    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        normalizedName: name.toLowerCase().trim(),
        businessCategory,
        barangay,
        city: city || 'Cebu City',
        province: 'Cebu',
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        discoverySource: discoverySource || 'MANUAL_ENTRY',
        digitalPresence: {
          create: {
            websiteStatus: 'NO_WEBSITE',
            rawAuditData: {},
            detectedTechnologies: [],
          },
        },
        opportunityAnalysis: {
          create: {
            primaryProblem: 'No digital presence established',
            recommendedService: 'Website Design & Development',
            opportunitySummary: 'Manually added business pending full digital audit.',
            recommendedOffer: 'Starter Website Package',
            leadScore: 50,
            confidenceScore: 0.5,
            aiModel: 'manual',
            analysisRawJson: {},
          },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'BUSINESS_CREATED_MANUAL',
        actor: 'USER',
        targetEntity: 'businesses',
        targetId: business.id,
        metadata: { name, barangay, city },
      },
    })

    return NextResponse.json({ success: true, business })
  } catch (error: any) {
    console.error('Error creating business:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
