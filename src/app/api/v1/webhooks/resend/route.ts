import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 })
    }

    const email = data.to?.[0]?.toLowerCase()?.trim()

    if (!email) {
      return NextResponse.json({ success: true, message: 'No target email found in event payload' })
    }

    // Handle bounce, unsubscribe, or complaint
    if (type === 'email.bounced' || type === 'email.complained' || type === 'email.unsubscribed') {
      const reason = type.replace('email.', '').toUpperCase()
      
      console.log(`[Resend Webhook] Email ${email} registered ${reason}. Adding to suppression list.`)

      // 1. Upsert to suppression list
      await prisma.suppressionList.upsert({
        where: { contactValue: email },
        update: { reason },
        create: {
          contactValue: email,
          reason,
          source: 'RESEND_WEBHOOK'
        }
      })

      // 2. Mark matching contact records as DNC
      await prisma.contact.updateMany({
        where: { contactValue: { equals: email, mode: 'insensitive' } },
        data: { doNotContact: true }
      })

      // 3. Cancel scheduled follow-ups associated with this email
      const matchedOutreach = await prisma.outreach.findMany({
        where: {
          contact: {
            contactValue: { equals: email, mode: 'insensitive' }
          }
        },
        select: { id: true }
      })

      const outreachIds = matchedOutreach.map(o => o.id)
      
      if (outreachIds.length > 0) {
        await prisma.followup.updateMany({
          where: {
            outreachId: { in: outreachIds },
            status: 'SCHEDULED'
          },
          data: { status: 'CANCELLED' }
        })
      }

      await prisma.auditLog.create({
        data: {
          action: 'CONTACT_SUPPRESSED',
          actor: 'RESEND_WEBHOOK',
          targetEntity: 'suppression_list',
          metadata: { email, reason }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in Resend Webhook handler:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
