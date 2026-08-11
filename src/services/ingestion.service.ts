import { prisma } from '../lib/db'
import { DiscoveredBusiness } from './discovery.service'
import { findDuplicateBusiness } from '../lib/utils/deduplication'
import { normalizeBusinessName, normalizePhoneNumber } from '../lib/utils/text-normalizer'
import { getErrorMessage } from '../lib/utils/errors'
import { auditQueue } from '../lib/redis/client'

export class IngestionService {
  /**
   * Ingests a list of discovered businesses into the database.
   * Handles deduplication, schema validation, and triggers downstream auditing.
   */
  public static async ingestBusinesses(
    businesses: DiscoveredBusiness[],
    limit: number = 15
  ): Promise<{
    added: number
    updated: number
    duplicatesSkipped: number
  }> {
    let added = 0
    let updated = 0
    let duplicatesSkipped = 0

    for (const rawBusiness of businesses) {
      try {
        // Database fields are required even for city-wide discovery. External
        // and simulated providers may omit barangay/city values at runtime.
        rawBusiness.barangay = rawBusiness.barangay?.trim() || 'City-wide'
        rawBusiness.city = rawBusiness.city?.trim() || 'Cebu City'

        // 1. Check suppression list first before doing anything
        if (rawBusiness.phone) {
          const cleanPhone = normalizePhoneNumber(rawBusiness.phone)
          const isSuppressed = await prisma.suppressionList.findUnique({
            where: { contactValue: cleanPhone },
          })
          if (isSuppressed) {
            duplicatesSkipped++
            continue
          }
        }

        // 2. Perform multi-layer duplicate check
        const dupResult = await findDuplicateBusiness({
          name: rawBusiness.name,
          barangay: rawBusiness.barangay,
          phone: rawBusiness.phone,
          websiteUrl: rawBusiness.websiteUrl,
        })

        if (dupResult.isDuplicate && dupResult.matchedBusinessId) {
          // Update the last checked timestamp for the existing business
          await prisma.business.update({
            where: { id: dupResult.matchedBusinessId },
            data: { dateLastChecked: new Date() },
          })

          // Check if we discovered new contact info for this existing business
          if (rawBusiness.phone) {
            const cleanPhone = normalizePhoneNumber(rawBusiness.phone)
            const phoneExists = await prisma.contact.findFirst({
              where: {
                businessId: dupResult.matchedBusinessId,
                contactType: 'BUSINESS_PHONE',
                contactValue: cleanPhone,
              },
            })

            if (!phoneExists) {
              await prisma.contact.create({
                data: {
                  businessId: dupResult.matchedBusinessId,
                  contactType: 'BUSINESS_PHONE',
                  contactValue: cleanPhone,
                  sourceUrl: rawBusiness.sourceUrl,
                  verificationStatus: 'UNVERIFIED',
                },
              })
            }
          }

          updated++
          
          // Trigger audit check again since we touched it
          try {
            await auditQueue.add(`audit-${dupResult.matchedBusinessId}`, {
              businessId: dupResult.matchedBusinessId,
            })
          } catch (qErr: unknown) {
            console.warn(`[Ingestion] Redis offline, skipping audit queue push for ${dupResult.matchedBusinessId}:`, getErrorMessage(qErr))
          }
          
          continue
        }

        // 3. Insert new business record
        const normalizedName = normalizeBusinessName(rawBusiness.name)

        const newBusiness = await prisma.business.create({
          data: {
            name: rawBusiness.name,
            normalizedName,
            businessCategory: rawBusiness.businessCategory,
            description: rawBusiness.description,
            barangay: rawBusiness.barangay,
            city: rawBusiness.city,
            province: rawBusiness.province,
            latitude: rawBusiness.latitude,
            longitude: rawBusiness.longitude,
            discoverySource: rawBusiness.discoverySource,
            sourceUrl: rawBusiness.sourceUrl,
          },
        })

        // 4. Create initial digital presence profile
        await prisma.digitalPresence.create({
          data: {
            businessId: newBusiness.id,
            websiteUrl: rawBusiness.websiteUrl || null,
            facebookUrl: rawBusiness.facebookUrl || null,
            websiteStatus: rawBusiness.websiteUrl ? 'OUTDATED_SITE' : (rawBusiness.facebookUrl ? 'FACEBOOK_ONLY' : 'NO_WEBSITE'),
            detectedTechnologies: [],
            rawAuditData: {},
          },
        })

        // 5. Add phone contact if exists
        if (rawBusiness.phone) {
          const cleanPhone = normalizePhoneNumber(rawBusiness.phone)
          await prisma.contact.create({
            data: {
              businessId: newBusiness.id,
              contactType: 'BUSINESS_PHONE',
              contactValue: cleanPhone,
              sourceUrl: rawBusiness.sourceUrl,
              verificationStatus: 'UNVERIFIED',
            },
          })
        }

        // 5.5 Create initial opportunity analysis with computed leadScore
        const initialLeadScore = 75 + (rawBusiness.phone ? 10 : 0) + (rawBusiness.businessCategory.toLowerCase().includes('clinic') ? 10 : 5)

        const catLower = rawBusiness.businessCategory.toLowerCase()
        let recService = 'NEXTJS_HIGH_CONVERTING_WEBSITE'
        if (catLower.includes('clinic') || catLower.includes('medical') || catLower.includes('dental') || catLower.includes('veterinary')) {
          recService = 'CLINIC_AUTOMATED_APPOINTMENT_PORTAL'
        } else if (catLower.includes('restaurant') || catLower.includes('cafe') || catLower.includes('coffee')) {
          recService = 'RESTAURANT_DIGITAL_MENU_RESERVATION'
        } else if (catLower.includes('salon') || catLower.includes('barber') || catLower.includes('gym') || catLower.includes('fitness') || catLower.includes('massage') || catLower.includes('spa')) {
          recService = 'CLIENT_BOOKING_MEMBERSHIP_PORTAL'
        } else if (catLower.includes('auto repair')) {
          recService = 'AUTO_REPAIR_SERVICE_BOOKING_PORTAL'
        } else if (catLower.includes('hardware')) {
          recService = 'INVENTORY_QUOTE_MANAGEMENT_SYSTEM'
        } else if (catLower.includes('accounting') || catLower.includes('law office')) {
          recService = 'PROFESSIONAL_SERVICES_CLIENT_PORTAL'
        }

        await prisma.opportunityAnalysis.create({
          data: {
            businessId: newBusiness.id,
            leadScore: Math.min(100, initialLeadScore),
            primaryProblem: rawBusiness.websiteUrl ? 'Website performance upgrade recommended' : 'No dedicated business website found online',
            recommendedService: recService,
            opportunitySummary: `High-value growth opportunity for ${rawBusiness.businessCategory} in Barangay ${rawBusiness.barangay}.`,
            recommendedOffer: `Custom Next.js web application & digital booking system for ${rawBusiness.name}`,
            confidenceScore: 0.85,
            aiModel: 'heuristic-scorer-v1',
            analysisRawJson: {},
          },
        }).catch((err) => console.warn(`[Ingestion] Could not create initial OpportunityAnalysis:`, err.message))

        // 6. Write Audit Log
        await prisma.auditLog.create({
          data: {
            action: 'LEAD_DISCOVERED',
            actor: 'DISCOVERY_SERVICE',
            targetEntity: 'businesses',
            targetId: newBusiness.id,
            metadata: {
              source: rawBusiness.discoverySource,
              sourceUrl: rawBusiness.sourceUrl,
            },
          },
        })

        added++

        // 7. Push to Deterministic Website Audit Queue
        try {
          await auditQueue.add(`audit-${newBusiness.id}`, {
            businessId: newBusiness.id,
          })
        } catch (qErr: unknown) {
          console.warn(`[Ingestion] Redis offline, skipping audit queue push for new business ${newBusiness.id}:`, getErrorMessage(qErr))
        }

        if (added >= limit) {
          console.log(`[Ingestion] Reached search limit of ${limit} new leads. Stopping ingestion.`)
          break
        }
      } catch (error: unknown) {
        console.error(`Error ingesting business "${rawBusiness.name}":`, getErrorMessage(error))
      }
    }

    return { added, updated, duplicatesSkipped }
  }
}
