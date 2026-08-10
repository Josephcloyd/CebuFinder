import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/redis/client'
import { prisma } from '../lib/db'
import { sendOutreachEmail } from '../lib/email/client'

const connection = getRedisConnection()

export const outreachWorker = new Worker(
  'outreach-dispatch-queue',
  async (job) => {
    const { outreachId } = job.data
    console.log(`[Outreach Worker] Attempting to send outreach ID: ${outreachId}`)

    try {
      // 1. Fetch outreach details
      const outreach = await prisma.outreach.findUnique({
        where: { id: outreachId },
        include: { business: true, contact: true },
      })

      if (!outreach || !outreach.contact) {
        throw new Error(`Outreach record or contact not found for ID: ${outreachId}`)
      }

      const email = outreach.contact.contactValue.trim().toLowerCase()

      // 2. Pre-send suppression list hard check
      const suppressed = await prisma.suppressionList.findUnique({
        where: { contactValue: email },
      })

      if (suppressed || outreach.contact.doNotContact) {
        console.warn(`[Outreach Worker] Target contact "${email}" is suppressed. Aborting send.`)
        await prisma.outreach.update({
          where: { id: outreachId },
          data: { status: 'OPTED_OUT' },
        })
        return { success: false, reason: 'SUPPRESSED' }
      }

      // 3. Send email via Resend
      const result = await sendOutreachEmail({
        to: email,
        subject: outreach.subject,
        bodyText: outreach.messageBody,
      })

      if (!result.success) {
        await prisma.outreach.update({
          where: { id: outreachId },
          data: { status: 'FAILED' },
        })
        
        await prisma.auditLog.create({
          data: {
            action: 'OUTREACH_FAILED',
            actor: 'OUTREACH_WORKER',
            targetEntity: 'outreach',
            targetId: outreachId,
            metadata: { error: result.error },
          },
        })

        return { success: false, error: result.error }
      }

      // 4. Update status to SENT
      await prisma.outreach.update({
        where: { id: outreachId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          resendMessageId: result.messageId,
        },
      })

      // 5. Audit Log Success
      await prisma.auditLog.create({
        data: {
          action: 'OUTREACH_SENT',
          actor: 'OUTREACH_WORKER',
          targetEntity: 'outreach',
          targetId: outreachId,
          metadata: { to: email, resendMessageId: result.messageId },
        },
      })

      // 6. Schedule Follow-up (Day 4)
      const followUpDelayMs = 4 * 24 * 60 * 60 * 1000 // 4 days in MS
      
      const scheduledAt = new Date(Date.now() + followUpDelayMs)
      
      // Calculate follow-up body text (value add)
      const followupSubject = `Re: ${outreach.subject}`
      const followupBody = `Hi ${outreach.business.name} team,\n\nJust following up on my email regarding your appointment booking process. I sketched a quick 1-page wireframe for your clinic that I would love to share. Let me know if you are open to seeing it.\n\nBest,\nCebu Digital Hub\n\n(Reply STOP to unsubscribe)`

      const followup = await prisma.followup.create({
        data: {
          outreachId: outreachId,
          stepNumber: 1,
          scheduledAt,
          status: 'SCHEDULED',
          subject: followupSubject,
          messageBody: followupBody,
        }
      })

      console.log(`[Outreach Worker] Email sent. Scheduled Follow-up 1 for lead: ${outreach.business.name} on ${scheduledAt.toISOString()}`)
      return { success: true, messageId: result.messageId, followupId: followup.id }

    } catch (err: any) {
      console.error(`[Outreach Worker] Failed to dispatch outreach ID ${outreachId}:`, err.message)
      throw err
    }
  },
  {
    connection,
    concurrency: 1, // Single sender concurrency to prevent blacklisting
    limiter: {
      max: 10,
      duration: 60000, // Max 10 sends per minute
    },
  }
)

outreachWorker.on('failed', (job, err) => {
  console.error(`[Outreach Worker] Job ${job?.id} failed:`, err.message)
})
