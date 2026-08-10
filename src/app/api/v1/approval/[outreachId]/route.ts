import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'
import { outreachQueue } from '../../../../../lib/redis/client'

export async function POST(
  request: Request,
  context: { params: Promise<{ outreachId: string }> | { outreachId: string } }
) {
  // Await params to handle Next.js 15+ / 16+ Promise-based params safely
  const params = await context.params
  const { outreachId } = params

  try {
    const body = await request.json()
    const { action, subject, messageBody, rejectionReason } = body

    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
      include: { contact: true, business: true }
    })

    if (!outreach) {
      return NextResponse.json({ success: false, error: 'Outreach record not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // 1. Update status to APPROVED & save edit adjustments
      const updated = await prisma.outreach.update({
        where: { id: outreachId },
        data: {
          status: 'APPROVED',
          subject: subject || outreach.subject,
          messageBody: messageBody || outreach.messageBody,
          approvedAt: new Date(),
          approvedBy: 'Human Dashboard',
        }
      })

      // 2. Dispatch to outreach sending queue
      await outreachQueue.add(`send-${outreachId}`, {
        outreachId: outreachId
      })

      // 3. Log the action
      await prisma.auditLog.create({
        data: {
          action: 'OUTREACH_APPROVED',
          actor: 'dashboard-user',
          targetEntity: 'outreach',
          targetId: outreachId,
        }
      })

      return NextResponse.json({ success: true, outreach: updated })
    }

    if (action === 'reject') {
      const updated = await prisma.outreach.update({
        where: { id: outreachId },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Rejected by user',
        }
      })

      await prisma.auditLog.create({
        data: {
          action: 'OUTREACH_REJECTED',
          actor: 'dashboard-user',
          targetEntity: 'outreach',
          targetId: outreachId,
          metadata: { reason: rejectionReason }
        }
      })

      return NextResponse.json({ success: true, outreach: updated })
    }

    if (action === 'opt-out') {
      // 1. Update outreach status to OPTED_OUT
      const updated = await prisma.outreach.update({
        where: { id: outreachId },
        data: {
          status: 'OPTED_OUT',
        }
      })

      // 2. Add contacts to suppression list & mark as DNC
      const contacts = await prisma.contact.findMany({
        where: { businessId: outreach.businessId }
      })

      for (const contact of contacts) {
        await prisma.suppressionList.upsert({
          where: { contactValue: contact.contactValue },
          update: { reason: 'USER_DNC_REQUEST' },
          create: {
            contactValue: contact.contactValue,
            reason: 'USER_DNC_REQUEST',
            source: 'DASHBOARD_MANUAL'
          }
        })

        await prisma.contact.update({
          where: { id: contact.id },
          data: { doNotContact: true }
        })
      }

      await prisma.auditLog.create({
        data: {
          action: 'BUSINESS_OPTED_OUT',
          actor: 'dashboard-user',
          targetEntity: 'businesses',
          targetId: outreach.businessId,
          metadata: { contactsCount: contacts.length }
        }
      })

      return NextResponse.json({ success: true, outreach: updated })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error handling approval action:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
