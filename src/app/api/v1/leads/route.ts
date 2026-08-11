import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { calculateLeadScore } from '../../../../lib/utils/lead-scorer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const barangay = searchParams.get('barangay')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const minScore = searchParams.get('minScore')
  const hasContacts = searchParams.get('hasContacts')
  const query = searchParams.get('query')

  try {
    const where: any = {}

    if (hasContacts === 'true') {
      where.contacts = { some: {} }
    } else if (hasContacts === 'false') {
      where.contacts = { none: {} }
    }

    if (city) {
      where.city = { equals: city, mode: 'insensitive' }
    }
    if (barangay) {
      where.barangay = { equals: barangay, mode: 'insensitive' }
    }
    if (category) {
      where.businessCategory = { equals: category, mode: 'insensitive' }
    }
    if (query) {
      where.name = { contains: query, mode: 'insensitive' }
    }

    if (status) {
      where.outreach = {
        some: { status: status as any }
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
      take: 100
    })

    // Process leads and auto-calculate opportunity score & analysis if missing
    let processedLeads = leads.map((lead: any) => {
      let analysis = lead.opportunityAnalysis
      const hasEmail = lead.contacts.some((c: any) => c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@'))
      const hasPhone = lead.contacts.some((c: any) => (c.contactType as string) === 'BUSINESS_PHONE' || !c.contactValue.includes('@'))
      const websiteStatus = lead.digitalPresence?.websiteStatus || 'NO_WEBSITE'

      // Always compute score if missing or 0
      const computedScore = calculateLeadScore({
        category: lead.businessCategory,
        websiteStatus: websiteStatus as any,
        isMobileResponsive: lead.digitalPresence?.isMobileResponsive ?? false,
        hasSsl: lead.digitalPresence?.hasSsl ?? false,
        hasEmail,
        hasPhone,
        hasFacebook: !!lead.digitalPresence?.facebookUrl || websiteStatus === 'FACEBOOK_ONLY',
      })

      const categoryLower = lead.businessCategory.toLowerCase()
      let recommendedService = 'NEXTJS_HIGH_CONVERTING_WEBSITE'
      if (categoryLower.includes('clinic') || categoryLower.includes('medical') || categoryLower.includes('dental') || categoryLower.includes('veterinary')) {
        recommendedService = 'CLINIC_AUTOMATED_APPOINTMENT_PORTAL'
      } else if (categoryLower.includes('restaurant') || categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
        recommendedService = 'RESTAURANT_DIGITAL_MENU_RESERVATION'
      } else if (categoryLower.includes('salon') || categoryLower.includes('barber') || categoryLower.includes('gym') || categoryLower.includes('fitness') || categoryLower.includes('massage') || categoryLower.includes('spa')) {
        recommendedService = 'CLIENT_BOOKING_MEMBERSHIP_PORTAL'
      } else if (categoryLower.includes('auto repair')) {
        recommendedService = 'AUTO_REPAIR_SERVICE_BOOKING_PORTAL'
      } else if (categoryLower.includes('hardware')) {
        recommendedService = 'INVENTORY_QUOTE_MANAGEMENT_SYSTEM'
      } else if (categoryLower.includes('accounting') || categoryLower.includes('law office')) {
        recommendedService = 'PROFESSIONAL_SERVICES_CLIENT_PORTAL'
      }

      if (!analysis || analysis.leadScore === 0) {
        analysis = {
          id: analysis?.id || `computed-${lead.id}`,
          businessId: lead.id,
          leadScore: computedScore,
          primaryProblem: websiteStatus === 'NO_WEBSITE' ? 'No website detected online' : 'Website performance upgrade recommended',
          recommendedService,
          opportunitySummary: `High-value opportunity for ${lead.businessCategory} in Barangay ${lead.barangay}.`,
          recommendedOffer: `Custom Next.js web application & digital booking system for ${lead.name}`,
          confidenceScore: 0.85,
          aiModel: 'heuristic-scorer-v1',
          analysisRawJson: {},
          analyzedAt: new Date(),
        } as any
      } else if (analysis && analysis.leadScore === 0) {
        analysis.leadScore = computedScore
      }

      return {
        ...lead,
        opportunityAnalysis: analysis,
      }
    })

    // Apply minScore filter after computing accurate scores
    if (minScore) {
      const score = parseInt(minScore, 10)
      if (!isNaN(score)) {
        processedLeads = processedLeads.filter(l => (l.opportunityAnalysis?.leadScore ?? 0) >= score)
      }
    }

    return NextResponse.json({ success: true, count: processedLeads.length, leads: processedLeads })
  } catch (error: any) {
    console.error('Error fetching leads:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, contactType, contactValue } = body

    if (!businessId || !contactValue) {
      return NextResponse.json({ success: false, error: 'businessId and contactValue are required.' }, { status: 400 })
    }

    const type = (contactType === 'BUSINESS_EMAIL' || contactValue.includes('@')) ? 'BUSINESS_EMAIL' : 'BUSINESS_PHONE'

    const newContact = await prisma.contact.create({
      data: {
        businessId,
        contactType: type,
        contactValue: contactValue.trim(),
        verificationStatus: 'VERIFIED',
      }
    })

    return NextResponse.json({ success: true, contact: newContact })
  } catch (error: any) {
    console.error('Error adding contact:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
