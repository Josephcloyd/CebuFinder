import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, tone = 'FRIENDLY', customOffer } = body

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId is required.' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        digitalPresence: true,
        contacts: true,
        opportunityAnalysis: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 })
    }

    const name = business.name
    const category = business.businessCategory
    const barangay = business.barangay
    const city = business.city
    const websiteStatus = business.digitalPresence?.websiteStatus || 'NO_WEBSITE'
    const hasWebsite = websiteStatus === 'FULLY_FUNCTIONAL'

    // Determine audit gap hook
    let auditHook = ''
    if (websiteStatus === 'NO_WEBSITE') {
      auditHook = `No official website detected for ${name} in ${barangay}. Customers searching Google on mobile are directed to competitor listings.`
    } else if (websiteStatus === 'FACEBOOK_ONLY') {
      auditHook = `${name} relies solely on Facebook Page messages for customer inquiries in ${barangay}, missing out on direct search traffic.`
    } else if (websiteStatus === 'OUTDATED_SITE' || websiteStatus === 'BROKEN_SITE') {
      auditHook = `${name}'s current website appears outdated or non-responsive on mobile devices.`
    } else {
      auditHook = `${name} has an active site but lacks automated booking and local SEO optimization.`
    }

    // Determine offer description
    const offer = customOffer || business.opportunityAnalysis?.recommendedOffer || `Custom Mobile-Friendly Website & Local SEO setup for ${category}`

    // Subject Line Variations
    let subject = ''
    let subjectVariations: string[] = []
    let emailBody = ''

    if (tone === 'PROFESSIONAL') {
      subject = `Digital Audit & Growth Proposal for ${name} (${barangay})`
      subjectVariations = [
        `Digital Audit & Growth Proposal for ${name} (${barangay})`,
        `Enhancing ${name}'s customer acquisition in ${city}`,
        `Quick question regarding ${name}'s online portal`,
      ]
      emailBody = `Dear ${name} Management,\n\nI hope this email finds you well.\n\nOur Cebu digital team recently completed an audit of ${category} businesses in ${barangay}, ${city}. During our review of ${name}, we identified a key growth opportunity:\n\n📌 Audit Insight: ${auditHook}\n\nWe specialize in designing high-converting, mobile-friendly digital solutions tailored for ${category} providers. We can build a streamlined ${offer} designed to capture local search intent and automate client bookings.\n\nWe have prepared a preliminary design mockup for your review. Would you be available for a brief 5-minute call this week to review the concept?\n\nSincerely,\nCebu Digital Hub Team\n\n(If you wish to opt out of future emails, please reply with STOP)`
    } else if (tone === 'URGENT') {
      subject = `Urgent: Missing mobile search leads for ${name}`
      subjectVariations = [
        `Urgent: Missing mobile search leads for ${name}`,
        `Are potential ${category} clients in ${barangay} missing ${name}?`,
        `Revenue opportunity for ${name} in ${city}`,
      ]
      emailBody = `Hi ${name} Team,\n\nDid you know that over 78% of local customers in ${city} search for ${category} services directly on their smartphones before making a decision?\n\nRight now, ${auditHook}\n\nEvery day without a modern mobile portal means potential clients in ${barangay} are heading to competitors instead.\n\nWe've created a ready-to-launch mockup of a ${offer} for ${name} to help capture these leads immediately.\n\nCan I send over a quick preview link for you to see how it looks?\n\nBest regards,\nCebu Digital Hub Team\n\n(Reply STOP to unsubscribe from future updates)`
    } else {
      // FRIENDLY (Default)
      subject = `Quick idea for ${name} in ${barangay} 👋`
      subjectVariations = [
        `Quick idea for ${name} in ${barangay} 👋`,
        `Free mockup for ${name} (${category})`,
        `Helping ${name} connect with more clients in ${city}`,
      ]
      emailBody = `Hi ${name} team!\n\nI was looking up local ${category} options around ${barangay}, ${city} and stumbled upon your business profile.\n\nI noticed that ${auditHook}\n\nTo help out local Cebu businesses, our team put together a quick, no-obligation preview mockup for a ${offer}.\n\nWould you be open to taking a 30-second look at the concept? No pressure at all—just wanted to share what we built!\n\nWarm regards,\nCebu Digital Hub Team\n\n(Reply STOP if you'd prefer not to hear from us)`
    }

    // Find contact email if available
    const emailContact = business.contacts.find((c) => c.contactType === 'BUSINESS_EMAIL')

    // Upsert Outreach Draft in DB
    const outreach = await prisma.outreach.create({
      data: {
        businessId: business.id,
        contactId: emailContact?.id || null,
        channel: 'EMAIL',
        subject,
        messageBody: emailBody,
        status: 'PENDING_APPROVAL',
      },
    })

    return NextResponse.json({
      success: true,
      outreachId: outreach.id,
      pitch: {
        businessName: name,
        category,
        barangay,
        city,
        tone,
        subject,
        subjectVariations,
        emailBody,
        auditHook,
        recommendedOffer: offer,
        hasEmailContact: !!emailContact,
        contactEmail: emailContact?.contactValue || null,
      },
    })
  } catch (error: any) {
    console.error('Error generating AI pitch:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
