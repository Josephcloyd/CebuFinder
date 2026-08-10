import { WebsiteStatus } from '../../generated/prisma/client'

interface LeadScoringInput {
  category: string
  websiteStatus: WebsiteStatus
  isMobileResponsive: boolean
  hasSsl: boolean
  hasEmail: boolean
  hasPhone: boolean
  hasFacebook: boolean
}

/**
 * Computes a lead score between 0 and 100 based on digital needs, reachability, margin, and activity.
 */
export function calculateLeadScore(input: LeadScoringInput): number {
  let score = 0

  // 1. Base Digital Need (Max 40 Points)
  if (input.websiteStatus === 'NO_WEBSITE' || input.websiteStatus === 'FACEBOOK_ONLY') {
    score += 40
  } else if (input.websiteStatus === 'BROKEN_SITE' || input.websiteStatus === 'PARKED_DOMAIN') {
    score += 35
  } else if (input.websiteStatus === 'OUTDATED_SITE' || !input.isMobileResponsive || !input.hasSsl) {
    score += 25
  }

  // 2. Contactability & Reachability (Max 30 Points)
  let reachScore = 0
  if (input.hasEmail) reachScore += 20
  if (input.hasPhone) reachScore += 10
  if (input.hasFacebook) reachScore += 5
  score += Math.min(30, reachScore)

  // 3. Category Margin & Value (Max 20 Points)
  const categoryLower = input.category.toLowerCase()
  if (
    categoryLower.includes('dental') ||
    categoryLower.includes('medical') ||
    categoryLower.includes('clinic') ||
    categoryLower.includes('contractor') ||
    categoryLower.includes('construction') ||
    categoryLower.includes('real estate') ||
    categoryLower.includes('law') ||
    categoryLower.includes('accounting')
  ) {
    score += 20 // High Margin
  } else if (
    categoryLower.includes('restaurant') ||
    categoryLower.includes('cafe') ||
    categoryLower.includes('salon') ||
    categoryLower.includes('barber') ||
    categoryLower.includes('gym') ||
    categoryLower.includes('fitness') ||
    categoryLower.includes('catering')
  ) {
    score += 15 // Mid Margin
  } else {
    score += 5 // Low Margin / Other
  }

  // 4. Operating Activity Signal (Max 10 Points)
  // If we have contact info or active social, it's a proxy for active operation
  if (input.hasPhone || input.hasFacebook) {
    score += 10
  }

  return Math.min(100, Math.max(0, score))
}
