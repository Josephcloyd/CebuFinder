import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/redis/client'
import { prisma } from '../lib/db'
import { analyzeOpportunity } from '../lib/ai/client'
import { calculateLeadScore } from '../lib/utils/lead-scorer'
import { VerificationService } from '../services/verification.service'

const connection = getRedisConnection()

export const aiAnalysisWorker = new Worker(
  'ai-analysis-queue',
  async (job) => {
    const { businessId } = job.data
    console.log(`[AI Analysis Worker] Running analysis for business: ${businessId}`)

    try {
      // 1. Fetch business and presence
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { digitalPresence: true, contacts: true },
      })

      if (!business || !business.digitalPresence) {
        throw new Error(`Business or digital presence not found for ID: ${businessId}`)
      }

      const presence = business.digitalPresence

      // 2. Call Claude AI opportunity generator
      const aiResult = await analyzeOpportunity(
        business.name,
        business.businessCategory,
        business.barangay,
        {
          websiteUrl: presence.websiteUrl,
          websiteStatus: presence.websiteStatus,
          httpStatusCode: presence.httpStatusCode,
          hasSsl: presence.hasSsl,
          isMobileResponsive: presence.isMobileResponsive,
          facebookUrl: presence.facebookUrl,
          instagramUrl: presence.instagramUrl,
          hasOnlineBooking: presence.hasOnlineBooking,
          hasEcommerce: presence.hasEcommerce,
          detectedTechnologies: presence.detectedTechnologies,
        }
      )

      // 3. Compute final mathematical lead score
      const leadScore = calculateLeadScore({
        category: business.businessCategory,
        websiteStatus: presence.websiteStatus,
        isMobileResponsive: presence.isMobileResponsive,
        hasSsl: presence.hasSsl,
        hasEmail: business.contacts.some((c) => c.contactType === 'BUSINESS_EMAIL'),
        hasPhone: business.contacts.some((c) => c.contactType === 'BUSINESS_PHONE'),
        hasFacebook: !!presence.facebookUrl,
      })

      // 4. Save opportunity analysis
      await prisma.opportunityAnalysis.upsert({
        where: { businessId },
        update: {
          primaryProblem: aiResult.primary_weakness,
          recommendedService: aiResult.recommended_service,
          opportunitySummary: aiResult.primary_opportunity,
          recommendedOffer: aiResult.recommended_offer,
          leadScore: leadScore, // Programmatic score
          confidenceScore: aiResult.confidence_score,
          aiModel: 'claude-3-5-haiku-20241022',
          analysisRawJson: aiResult as any,
          analyzedAt: new Date(),
        },
        create: {
          businessId,
          primaryProblem: aiResult.primary_weakness,
          recommendedService: aiResult.recommended_service,
          opportunitySummary: aiResult.primary_opportunity,
          recommendedOffer: aiResult.recommended_offer,
          leadScore: leadScore, // Programmatic score
          confidenceScore: aiResult.confidence_score,
          aiModel: 'claude-3-5-haiku-20241022',
          analysisRawJson: aiResult as any,
        },
      })

      // 5. Run Verification Pipeline
      const verifyResult = await VerificationService.verifyLead(businessId)
      
      if (!verifyResult.isValid) {
        console.warn(`[AI Analysis Worker] Lead ${business.name} (${businessId}) failed verification: ${verifyResult.failureReason}`)
        
        // Log failure
        await prisma.auditLog.create({
          data: {
            action: 'LEAD_VERIFICATION_FAILED',
            actor: 'AI_ANALYSIS_WORKER',
            targetEntity: 'businesses',
            targetId: businessId,
            metadata: { reason: verifyResult.failureReason },
          },
        })
        return { verified: false, reason: verifyResult.failureReason }
      }

      // 6. Find target email contact
      const emailContact = business.contacts.find((c) => c.contactType === 'BUSINESS_EMAIL' && !c.doNotContact)
      const targetContactId = emailContact?.id || business.contacts[0]?.id || null

      // 7. Create Outreach draft record with status PENDING_APPROVAL
      await prisma.outreach.create({
        data: {
          businessId,
          contactId: targetContactId,
          channel: 'EMAIL',
          subject: aiResult.draft_outreach_email.subject,
          messageBody: aiResult.draft_outreach_email.body_plain_text,
          status: 'PENDING_APPROVAL',
        },
      })

      console.log(`[AI Analysis Worker] Created outreach draft for ${business.name}. Status: PENDING_APPROVAL`)
      return { verified: true, outreachCreated: true }

    } catch (err: any) {
      console.error(`[AI Analysis Worker] Error analyzing business ${businessId}:`, err.message)
      throw err
    }
  },
  { connection, concurrency: 3 }
)

aiAnalysisWorker.on('failed', (job, err) => {
  console.error(`[AI Analysis Worker] Job ${job?.id} failed:`, err.message)
})
