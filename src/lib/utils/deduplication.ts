import { prisma } from '../db'
import { normalizeBusinessName, normalizePhoneNumber, normalizeDomain } from './text-normalizer'

/**
 * Computes Jaro-Winkler similarity between two strings
 */
export function jaroWinklerDistance(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0
  if (s1 === s2) return 1

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  const s1Matches = new Array(s1.length).fill(false)
  const s2Matches = new Array(s2.length).fill(false)

  let m = 0
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range)
    const end = Math.min(i + range + 1, s2.length)
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue
      if (s1[i] === s2[j]) {
        s1Matches[i] = true
        s2Matches[j] = true
        m++
        break
      }
    }
  }

  if (m === 0) return 0

  let t = 0
  let k = 0
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) t++
    k++
  }
  t = t / 2

  const jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3

  let l = 0
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length))
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      l++
    } else {
      break
    }
  }

  const p = 0.1
  return jaro + l * p * (1 - jaro)
}

interface DuplicateCheckInput {
  name: string
  barangay: string
  phone?: string
  websiteUrl?: string
}

interface DuplicateCheckResult {
  isDuplicate: boolean
  matchedBusinessId?: string
  reason?: string
}

/**
 * Checks if a business already exists in the database.
 * Multi-layer check:
 * 1. Match on website domain (if provided).
 * 2. Match on normalized phone number (if provided).
 * 3. Match on normalized name + same barangay using Jaro-Winkler (threshold >= 0.88).
 */
export async function findDuplicateBusiness(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
  // 1. Check by Website Domain
  if (input.websiteUrl) {
    const targetDomain = normalizeDomain(input.websiteUrl)
    if (targetDomain) {
      const existingPresence = await prisma.digitalPresence.findFirst({
        where: {
          websiteUrl: {
            contains: targetDomain,
            mode: 'insensitive',
          },
        },
        select: { businessId: true, websiteUrl: true },
      })

      if (existingPresence && existingPresence.websiteUrl && normalizeDomain(existingPresence.websiteUrl) === targetDomain) {
        return {
          isDuplicate: true,
          matchedBusinessId: existingPresence.businessId,
          reason: `Exact website domain match: ${targetDomain}`,
        }
      }
    }
  }

  // 2. Check by Normalized Phone Number
  if (input.phone) {
    const targetPhone = normalizePhoneNumber(input.phone)
    if (targetPhone) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          contactType: 'BUSINESS_PHONE',
          contactValue: targetPhone,
          doNotContact: false,
        },
        select: { businessId: true },
      })

      if (existingContact) {
        return {
          isDuplicate: true,
          matchedBusinessId: existingContact.businessId,
          reason: `Exact business phone match: ${targetPhone}`,
        }
      }
    }
  }

  // 3. Check by Fuzzy Name Match within the same Barangay
  const incomingNormalized = normalizeBusinessName(input.name)
  const existingBusinesses = await prisma.business.findMany({
    where: {
      barangay: {
        equals: input.barangay,
        mode: 'insensitive',
      },
    },
    select: { id: true, name: true, normalizedName: true },
  })

  const threshold = 0.88
  for (const existing of existingBusinesses) {
    const existingNormalized = existing.normalizedName || normalizeBusinessName(existing.name)
    const similarity = jaroWinklerDistance(incomingNormalized, existingNormalized)
    
    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        matchedBusinessId: existing.id,
        reason: `Fuzzy business name match in ${input.barangay} (${Math.round(similarity * 100)}% similarity)`,
      }
    }
  }

  return { isDuplicate: false }
}
