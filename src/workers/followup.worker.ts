import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/redis/client'
import { prisma } from '../lib/db'
import { sendOutreachEmail } from '../lib/email/client'

const connection = getRedisConnection()

export const followupWorker = new Worker(
  'followup-queue', // We can run a job on this queue to dispatch due follow-ups
  async (job) => {
    console.log(`[Follow-up Worker] Polling and processing due follow-ups...`)

    try {
      const now = new Date()

      // 1. Fetch all scheduled followups that are due
      const dueFollowups = await prisma.followup.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
        include: {
          outreach: {
            include: {
              business: true,
              contact: true,
            },
          },
        },
      })

      console.log(`[Follow-up Worker] Found ${dueFollowups.length} due follow-up emails.`)

      for (const followup of dueFollowups) {
        const outreach = followup.outreach
        const contact = outreach.contact

        if (!contact) {
          await prisma.followup.update({
            where: { id: followup.id },
            data: { status: 'FAILED' },
          })
          continue
        }

        const email = contact.contactValue.trim().toLowerCase()

        // 2. Cancellation Check: Did the lead reply? Or is it suppressed?
        const isSuppressed = await prisma.suppressionList.findUnique({
          where: { contactValue: email },
        })

        if (
          outreach.status === 'REPLIED' ||
          outreach.repliedAt !== null ||
          contact.doNotContact ||
          isSuppressed
        ) {
          console.log(`[Follow-up Worker] Lead ${outreach.business.name} replied or is suppressed. Cancelling followup ${followup.id}`)
          await prisma.followup.update({
            where: { id: followup.id },
            data: { status: 'CANCELLED' },
          })
          continue
        }

        // 3. Dispatch follow-up email
        const result = await sendOutreachEmail({
          to: email,
          subject: followup.subject,
          bodyText: followup.messageBody,
        })

        if (!result.success) {
          console.error(`[Follow-up Worker] Failed to send email to ${email}: ${result.error}`)
          await prisma.followup.update({
            where: { id: followup.id },
            data: { status: 'FAILED' },
          })
          continue
        }

        // 4. Update follow-up status to SENT
        await prisma.followup.update({
          where: { id: followup.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        })

        // 5. Write audit log
        await prisma.auditLog.create({
          data: {
            action: 'FOLLOWUP_SENT',
            actor: 'FOLLOWUP_WORKER',
            targetEntity: 'followups',
            targetId: followup.id,
            metadata: { stepNumber: followup.stepNumber, to: email },
          },
        })

        // 6. If this was Step 1, schedule Step 2 (Day 10 breakup email)
        if (followup.stepNumber === 1) {
          const step2DelayMs = 6 * 24 * 60 * 60 * 1000 // 6 more days (Day 4 to Day 10)
          const step2ScheduledAt = new Date(Date.now() + step2DelayMs)
          const step2Subject = `Re: ${outreach.subject}`
          const step2Body = `Hi ${outreach.business.name} team,\n\nI haven't heard back, so I assume online scheduling isn't a priority for your clinic right now. I'll stop reaching out. Feel free to message back if you change your mind.\n\nBest regards,\nCebu Digital Hub\n\n(Reply STOP to unsubscribe)`

          await prisma.followup.create({
            data: {
              outreachId: outreach.id,
              stepNumber: 2,
              scheduledAt: step2ScheduledAt,
              status: 'SCHEDULED',
              subject: step2Subject,
              messageBody: step2Body,
            },
          })

          console.log(`[Follow-up Worker] Scheduled final Step 2 follow-up for ${outreach.business.name} on ${step2ScheduledAt.toISOString()}`)
        }
      }

      return { processed: dueFollowups.length }
    } catch (err: any) {
      console.error(`[Follow-up Worker] Error in execution:`, err.message)
      throw err
    }
  },
  { connection, concurrency: 1 }
)

followupWorker.on('failed', (job, err) => {
  console.error(`[Follow-up Worker] Job ${job?.id} failed:`, err.message)
})
