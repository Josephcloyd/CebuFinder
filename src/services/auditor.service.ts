import dns from 'dns'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '../lib/db'
import { normalizeDomain, normalizePhoneNumber } from '../lib/utils/text-normalizer'
import { aiAnalysisQueue } from '../lib/redis/client'

export interface AuditResults {
  websiteStatus: 'NO_WEBSITE' | 'FACEBOOK_ONLY' | 'PARKED_DOMAIN' | 'OUTDATED_SITE' | 'BROKEN_SITE' | 'FULLY_FUNCTIONAL'
  httpStatusCode?: number
  hasSsl: boolean
  isMobileResponsive: boolean
  facebookUrl?: string
  instagramUrl?: string
  hasOnlineBooking: boolean
  hasEcommerce: boolean
  detectedTechnologies: string[]
  emailsFound: string[]
  phonesFound: string[]
  rawAuditData: Record<string, any>
}

export class AuditorService {
  /**
   * Runs the deterministic audit on a business's website.
   * Updates database state and triggers the AI analysis queue.
   */
  public static async auditBusiness(businessId: string): Promise<AuditResults> {
    // 1. Fetch current digital presence
    const presence = await prisma.digitalPresence.findUnique({
      where: { businessId },
      include: { business: true },
    })

    if (!presence) {
      throw new Error(`DigitalPresence record not found for business ID: ${businessId}`)
    }

    const websiteUrl = presence.websiteUrl
    const facebookUrl = presence.facebookUrl

    // 2. Base default state if no website exists
    let results: AuditResults = {
      websiteStatus: websiteUrl ? 'OUTDATED_SITE' : (facebookUrl ? 'FACEBOOK_ONLY' : 'NO_WEBSITE'),
      hasSsl: false,
      isMobileResponsive: false,
      facebookUrl: facebookUrl || undefined,
      hasOnlineBooking: false,
      hasEcommerce: false,
      detectedTechnologies: [],
      emailsFound: [],
      phonesFound: [],
      rawAuditData: {},
    }

    if (!websiteUrl) {
      // Update digital presence with base state and proceed to AI analysis queue
      await this.saveAuditResults(businessId, results)
      return results
    }

    const targetDomain = normalizeDomain(websiteUrl)
    results.rawAuditData.normalizedDomain = targetDomain

    // 3. DNS lookup check
    try {
      await dns.promises.resolve(targetDomain)
    } catch (dnsErr: any) {
      results.websiteStatus = 'BROKEN_SITE'
      results.rawAuditData.dnsError = dnsErr.message
      await this.saveAuditResults(businessId, results)
      return results
    }

    // 4. HTTP Fetch Check
    try {
      const response = await axios.get(websiteUrl, {
        timeout: 8000,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        validateStatus: () => true, // Fetch body even for 4xx/5xx to check for parked domain indicators
      })

      results.httpStatusCode = response.status
      results.hasSsl = websiteUrl.startsWith('https://')

      if (response.status >= 400) {
        results.websiteStatus = 'BROKEN_SITE'
        results.rawAuditData.httpError = `HTTP Status ${response.status}`
      } else {
        results.websiteStatus = 'FULLY_FUNCTIONAL' // Base assumption, check content next
        
        // 5. DOM Cheerio parsing
        const html = response.data
        if (typeof html === 'string') {
          const $ = cheerio.load(html)
          
          // Check responsiveness
          const viewport = $('meta[name="viewport"]').attr('content') || ''
          results.isMobileResponsive = viewport.includes('width=device-width')

          // Scan social links if not already present
          $('a[href]').each((_, elem) => {
            const href = $(elem).attr('href') || ''
            if (href.includes('facebook.com/') && !results.facebookUrl) {
              results.facebookUrl = href
            }
            if (href.includes('instagram.com/') && !results.instagramUrl) {
              results.instagramUrl = href
            }
          })

          // Detect online booking
          const bodyText = $('body').text().toLowerCase()
          const bookingKeywords = ['book now', 'booking', 'appointment', 'schedul', 'calendly', 'fresha', 'acuity', 'simplybook']
          const bookingMatch = bookingKeywords.some((word) => bodyText.includes(word))
          if (bookingMatch) {
            results.hasOnlineBooking = true
            results.detectedTechnologies.push('BOOKING_INTEGRATION_SUSPECTED')
          }

          // Detect e-commerce
          const ecommerceKeywords = ['add to cart', 'add to bag', 'checkout', 'cart', 'shop', 'shopify', 'woocommerce']
          const ecommerceMatch = ecommerceKeywords.some((word) => bodyText.includes(word))
          if (ecommerceMatch) {
            results.hasEcommerce = true
            results.detectedTechnologies.push('ECOMMERCE_SUSPECTED')
          }

          // Search for tech signatures
          if (html.includes('wp-content') || html.includes('wp-includes')) {
            results.detectedTechnologies.push('WordPress')
          }
          if (html.includes('cdn.shopify.com')) {
            results.detectedTechnologies.push('Shopify')
          }
          if (html.includes('wix.com')) {
            results.detectedTechnologies.push('Wix')
          }
          if (html.includes('squarespace.com')) {
            results.detectedTechnologies.push('Squarespace')
          }

          // Check if parked domain
          const parkedKeywords = ['domain for sale', 'buy this domain', 'hugedomains', 'godaddy parking', 'this domain is parked']
          const isParked = parkedKeywords.some((word) => bodyText.includes(word))
          if (isParked) {
            results.websiteStatus = 'PARKED_DOMAIN'
          }

          // Check for outdated copyright year
          const copyrightRegex = /(?:©|copyright).*?(20\d{2})/i
          const copyrightMatch = bodyText.match(copyrightRegex)
          if (copyrightMatch && copyrightMatch[1]) {
            const year = parseInt(copyrightMatch[1], 10)
            const currentYear = new Date().getFullYear()
            if (currentYear - year >= 3) {
              results.websiteStatus = 'OUTDATED_SITE'
              results.rawAuditData.outdatedCopyright = year
            }
          }

          // Extract public contacts: Email & Phone
          // Emails
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
          const emails = html.match(emailRegex) || []
          results.emailsFound = Array.from(new Set(emails))
            .filter((email) => !email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.gif')) // remove false positives

          // Phones
          const phoneRegex = /(?:\+?63|0)[2-9]\d{2,3}[-\s]?\d{3}[-\s]?\d{4}/g
          const phones = html.match(phoneRegex) || []
          results.phonesFound = Array.from(new Set(phones)).map(p => normalizePhoneNumber(p)).filter(p => p.length >= 7)
        }
      }
    } catch (httpErr: any) {
      results.websiteStatus = 'BROKEN_SITE'
      results.rawAuditData.httpError = httpErr.message
    }

    // 6. Save audit results to Database
    await this.saveAuditResults(businessId, results)
    return results
  }

  /**
   * Helper to write audit findings to DB and update contacts/presence
   */
  private static async saveAuditResults(businessId: string, audit: AuditResults): Promise<void> {
    // Update presence
    await prisma.digitalPresence.update({
      where: { businessId },
      data: {
        websiteStatus: audit.websiteStatus,
        httpStatusCode: audit.httpStatusCode || null,
        hasSsl: audit.hasSsl,
        isMobileResponsive: audit.isMobileResponsive,
        facebookUrl: audit.facebookUrl || null,
        instagramUrl: audit.instagramUrl || null,
        hasOnlineBooking: audit.hasOnlineBooking,
        hasEcommerce: audit.hasEcommerce,
        detectedTechnologies: audit.detectedTechnologies,
        rawAuditData: audit.rawAuditData,
        auditedAt: new Date(),
      },
    })

    // Ingest discovered contacts
    // Save emails
    for (const email of audit.emailsFound) {
      const exists = await prisma.suppressionList.findUnique({ where: { contactValue: email } })
      if (exists) continue

      const contactExists = await prisma.contact.findFirst({
        where: { businessId, contactType: 'BUSINESS_EMAIL', contactValue: email },
      })
      if (!contactExists) {
        await prisma.contact.create({
          data: {
            businessId,
            contactType: 'BUSINESS_EMAIL',
            contactValue: email.toLowerCase(),
            verificationStatus: 'UNVERIFIED',
          },
        })
      }
    }

    // Save phones
    for (const phone of audit.phonesFound) {
      const exists = await prisma.suppressionList.findUnique({ where: { contactValue: phone } })
      if (exists) continue

      const contactExists = await prisma.contact.findFirst({
        where: { businessId, contactType: 'BUSINESS_PHONE', contactValue: phone },
      })
      if (!contactExists) {
        await prisma.contact.create({
          data: {
            businessId,
            contactType: 'BUSINESS_PHONE',
            contactValue: phone,
            verificationStatus: 'UNVERIFIED',
          },
        })
      }
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'LEAD_AUDITED',
        actor: 'AUDITOR_SERVICE',
        targetEntity: 'digital_presence',
        metadata: {
          websiteStatus: audit.websiteStatus,
          emailsCount: audit.emailsFound.length,
          phonesCount: audit.phonesFound.length,
        },
      },
    })

    // Trigger AI Opportunity Analysis Pipeline
    await aiAnalysisQueue.add(`analyze-${businessId}`, { businessId })
  }
}
