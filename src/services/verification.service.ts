import { prisma } from '../lib/db'
import { normalizePhoneNumber } from '../lib/utils/text-normalizer'

export interface VerificationResult {
  isValid: boolean
  failureReason?: string
}

export class VerificationService {
  /**
   * Run sanity and hallucination checks on the business lead before creating an outreach draft.
   */
  public static async verifyLead(businessId: string): Promise<VerificationResult> {
    // 1. Fetch all business data, digital presence, contacts, and AI analysis
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        digitalPresence: true,
        contacts: true,
        opportunityAnalysis: true,
      },
    })

    if (!business) {
      return { isValid: false, failureReason: 'Business record not found.' }
    }

    const presence = business.digitalPresence
    const analysis = business.opportunityAnalysis

    if (!presence) {
      return { isValid: false, failureReason: 'Digital presence audit record is missing.' }
    }

    if (!analysis) {
      return { isValid: false, failureReason: 'AI opportunity analysis record is missing.' }
    }

    // 2. Geographic boundary check
    const validBarangays = [
      'lahug', 'mabolo', 'banilad', 'kamputhaw', 'kasambagan', 
      'zapatera', 'capitol site', 'guadalupe', 'talamban', 'tisa', 'labangon'
    ]
    const barangayLower = business.barangay.toLowerCase()
    const matchesBarangay = validBarangays.some(b => barangayLower.includes(b))
    if (!matchesBarangay) {
      return { isValid: false, failureReason: `Business location "${business.barangay}" falls outside MVP target areas.` }
    }

    // 3. Contact availability check
    if (business.contacts.length === 0) {
      return { isValid: false, failureReason: 'No public contact methods (phone or email) found for this business.' }
    }

    // 4. Suppression List check
    for (const contact of business.contacts) {
      const cleanValue = contact.contactType === 'BUSINESS_PHONE' 
        ? normalizePhoneNumber(contact.contactValue) 
        : contact.contactValue.toLowerCase()
        
      const suppressed = await prisma.suppressionList.findUnique({
        where: { contactValue: cleanValue },
      })

      if (suppressed || contact.doNotContact) {
        return { isValid: false, failureReason: `Contact "${contact.contactValue}" is registered on the suppression/DNC list.` }
      }
    }

    // 5. Hallucination Check A: Website Status consistency
    const presenceStatus = presence.websiteStatus
    const aiPresenceStatus = (analysis.analysisRawJson as any)?.current_digital_presence as string | undefined

    if (presenceStatus === 'FULLY_FUNCTIONAL' && aiPresenceStatus === 'NONE') {
      return { 
        isValid: false, 
        failureReason: 'AI Hallucination detected: AI states no website exists, but auditor verified active website.' 
      }
    }

    // 6. Hallucination Check B: Category to Service alignment
    const categoryLower = business.businessCategory.toLowerCase()
    const recService = analysis.recommendedService

    if (
      (categoryLower.includes('clinic') || categoryLower.includes('dentist') || categoryLower.includes('medical')) &&
      recService === 'RESTAURANT_DIGITAL_MENU_RESERVATION'
    ) {
      return {
        isValid: false,
        failureReason: 'AI Hallucination detected: Restaurant service recommended for a medical clinic.'
      }
    }

    if (
      (categoryLower.includes('restaurant') || categoryLower.includes('cafe')) &&
      recService === 'CLINIC_APPOINTMENT_PORTAL'
    ) {
      return {
        isValid: false,
        failureReason: 'AI Hallucination detected: Clinic appointment service recommended for a food establishment.'
      }
    }

    // 7. Hallucination Check C: Message contains placeholders or bracketed text
    // E.g., [insert name], [Barangay], etc.
    const outreachText = ((analysis.analysisRawJson as any)?.draft_outreach_email?.body_plain_text || '') as string
    if (/\[.*?\]|\{.*?\}/.test(outreachText)) {
      return {
        isValid: false,
        failureReason: 'AI Hallucination detected: Outreach draft contains unreplaced bracketed placeholders.'
      }
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        action: 'LEAD_VERIFIED',
        actor: 'VERIFICATION_SERVICE',
        targetEntity: 'businesses',
        targetId: businessId,
        metadata: { isValid: true },
      },
    })

    return { isValid: true }
  }
}
