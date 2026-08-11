import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'
import { sendOutreachEmail } from '../../../../../lib/email/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessId, contactValue, contactType, subject, messageBody } = body

    if (!businessId || !contactValue || !messageBody) {
      return NextResponse.json({ success: false, error: 'businessId, contactValue, and messageBody are required.' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 })
    }

    // Check suppression list first
    const suppressed = await prisma.suppressionList.findFirst({
      where: { contactValue: { equals: contactValue.trim().toLowerCase(), mode: 'insensitive' } }
    })

    if (suppressed) {
      return NextResponse.json({
        success: false,
        error: `Contact ${contactValue} is suppressed (${suppressed.reason}). Cannot send outreach.`
      }, { status: 400 })
    }

    if (contactType === 'BUSINESS_EMAIL' || contactValue.includes('@')) {
      // Send Email via Resend Client
      const result = await sendOutreachEmail({
        to: contactValue.trim(),
        subject: subject || `Website & System Upgrade Proposal for ${business.name}`,
        bodyText: messageBody,
      })

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'Failed to send email' }, { status: 500 })
      }

      // Record outreach log in database
      const outreachRecord = await prisma.outreach.create({
        data: {
          businessId: business.id,
          channel: 'EMAIL',
          status: 'SENT',
          subject: subject || `Website & System Upgrade Proposal for ${business.name}`,
          messageBody: messageBody,
          resendMessageId: result.messageId,
          sentAt: new Date(),
        }
      })

      return NextResponse.json({
        success: true,
        message: `Outreach email successfully sent to ${contactValue}!`,
        outreachId: outreachRecord.id,
        messageId: result.messageId,
      })
    } else {
      // Text / SMS / WhatsApp Outreach
      const outreachRecord = await prisma.outreach.create({
        data: {
          businessId: business.id,
          channel: 'SMS',
          status: 'SENT',
          subject: 'SMS / Text Outreach',
          messageBody: messageBody,
          sentAt: new Date(),
        }
      })

      return NextResponse.json({
        success: true,
        message: `SMS outreach logged for ${contactValue}.`,
        outreachId: outreachRecord.id,
      })
    }
  } catch (error: any) {
    console.error('Error sending direct outreach:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
