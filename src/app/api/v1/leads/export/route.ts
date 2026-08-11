import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hasContacts = searchParams.get('hasContacts')
    const city = searchParams.get('city')
    const barangay = searchParams.get('barangay')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const onlyWithEmail = searchParams.get('onlyWithEmail') === 'true'

    const whereClause: any = {}

    if (hasContacts === 'true') {
      whereClause.contacts = { some: {} }
    } else if (hasContacts === 'false') {
      whereClause.contacts = { none: {} }
    }

    if (city && city !== 'ALL' && city !== 'All') {
      whereClause.city = { contains: city, mode: 'insensitive' }
    }
    if (barangay && barangay !== 'ALL' && barangay !== 'All') {
      whereClause.barangay = { contains: barangay, mode: 'insensitive' }
    }
    if (category && category !== 'ALL' && category !== 'All') {
      whereClause.businessCategory = { contains: category, mode: 'insensitive' }
    }
    if (status && status !== 'ALL' && status !== 'All') {
      whereClause.digitalPresence = { websiteStatus: status }
    }

    if (onlyWithEmail) {
      whereClause.contacts = {
        some: {
          contactType: 'BUSINESS_EMAIL',
        },
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
      take: 500,
    })

    // Helper to escape CSV cell value
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    // Build CSV Headers
    const headers = [
      'Business Name',
      'Category',
      'Barangay',
      'City',
      'Website Status',
      'Website URL',
      'Facebook URL',
      'Email Contacts',
      'Phone Contacts',
      'Opportunity Score',
      'Primary Digital Issue',
      'Recommended Offer',
      'Date Discovered',
    ]

    const rows = businesses.map((b) => {
      const emailContacts = b.contacts
        .filter((c) => c.contactType === 'BUSINESS_EMAIL' || c.contactValue.includes('@'))
        .map((c) => c.contactValue)
        .join('; ')

      const phoneContacts = b.contacts
        .filter((c) => c.contactType === 'BUSINESS_PHONE' || c.contactType === 'WHATSAPP' || c.contactType === 'VIBER' || !c.contactValue.includes('@'))
        .map((c) => c.contactValue)
        .join('; ')

      const formattedDate = new Date(b.dateDiscovered).toLocaleDateString('en-US')

      return [
        escapeCsv(b.name),
        escapeCsv(b.businessCategory),
        escapeCsv(b.barangay),
        escapeCsv(b.city),
        escapeCsv(b.digitalPresence?.websiteStatus || 'NO_WEBSITE'),
        escapeCsv(b.digitalPresence?.websiteUrl || ''),
        escapeCsv(b.digitalPresence?.facebookUrl || ''),
        escapeCsv(emailContacts),
        escapeCsv(phoneContacts),
        escapeCsv(b.opportunityAnalysis?.leadScore || 50),
        escapeCsv(b.opportunityAnalysis?.primaryProblem || 'Missing Online Presence'),
        escapeCsv(b.opportunityAnalysis?.recommendedOffer || 'Mobile Responsive Website'),
        escapeCsv(formattedDate),
      ].join(',')
    })

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n')

    const filename = `cebu_digital_leads_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting leads CSV:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
