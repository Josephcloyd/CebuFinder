import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { businessId, toEmail, subject, body } = await request.json()

    if (!businessId || !toEmail || !subject || !body) {
      return NextResponse.json({ success: false, error: 'Missing required fields: businessId, toEmail, subject, body' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ success: false, error: 'RESEND_API_KEY not configured. Add it to your .env file.' }, { status: 500 })
    }

    // Find a contact for this business to link to
    const contact = await prisma.contact.findFirst({
      where: { businessId, contactType: 'BUSINESS_EMAIL', doNotContact: false },
    })

    // Create the outreach record
    const outreach = await prisma.outreach.create({
      data: {
        businessId,
        contactId: contact?.id ?? null,
        channel: 'EMAIL',
        subject,
        messageBody: body,
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Send via Resend API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cebu Digital Finder <outreach@yourdomain.com>',
        to: [toEmail],
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      // Revert outreach status to FAILED
      await prisma.outreach.update({
        where: { id: outreach.id },
        data: { status: 'FAILED' },
      })
      return NextResponse.json({ success: false, error: resendData.message || 'Resend API error' }, { status: 500 })
    }

    // Store the Resend message ID
    await prisma.outreach.update({
      where: { id: outreach.id },
      data: { resendMessageId: resendData.id },
    })

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_SENT',
        actor: 'USER',
        targetEntity: 'businesses',
        targetId: businessId,
        metadata: { subject, toEmail, resendMessageId: resendData.id },
      },
    })

    return NextResponse.json({
      success: true,
      outreachId: outreach.id,
      resendMessageId: resendData.id,
      message: `Email sent to ${toEmail}`,
    })
  } catch (error: any) {
    console.error('Send email error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
