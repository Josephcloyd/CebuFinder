import { prisma } from '../lib/db'
import { DiscoveredBusiness } from './discovery.service'
import { findDuplicateBusiness } from '../lib/utils/deduplication'
import { normalizeBusinessName, normalizePhoneNumber } from '../lib/utils/text-normalizer'
import { auditQueue } from '../lib/redis/client'

export class IngestionService {
  /**
   * Ingests a list of discovered businesses into the database.
   * Handles deduplication, schema validation, and triggers downstream auditing.
   */
  public static async ingestBusinesses(businesses: DiscoveredBusiness[]): Promise<{
    added: number
    updated: number
    duplicatesSkipped: number
  }> {
    let added = 0
    let updated = 0
    let duplicatesSkipped = 0

    for (const rawBusiness of businesses) {
      try {
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
          await auditQueue.add(`audit-${dupResult.matchedBusinessId}`, {
            businessId: dupResult.matchedBusinessId,
          })
          
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
        await auditQueue.add(`audit-${newBusiness.id}`, {
          businessId: newBusiness.id,
        })

      } catch (error: any) {
        console.error(`Error ingesting business "${rawBusiness.name}":`, error.message)
      }
    }

    return { added, updated, duplicatesSkipped }
  }
}
