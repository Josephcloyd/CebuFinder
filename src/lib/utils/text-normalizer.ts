/**
 * Normalizes business names for precise fuzzy comparison.
 */
export function normalizeBusinessName(name: string): string {
  if (!name) return ''

  let normalized = name.toLowerCase()

  // Remove common Philippines business suffixes and descriptors
  const suffixes = [
    /\binc(orporated)?\b/g,
    /\bcorp(oration)?\b/g,
    /\bco(mpany)?\b/g,
    /\bltd\b/g,
    /\blimited\b/g,
    /\bphilippines?\b/g,
    /\bph\b/g,
    /\bcebu branch\b/g,
    /\bbranch\b/g,
    /\bcebu\b/g,
    /\bpty\b/g,
    /\bsdn bhd\b/g,
  ]

  for (const pattern of suffixes) {
    normalized = normalized.replace(pattern, '')
  }

  // Remove symbols, punctuation, and extra whitespace
  normalized = normalized.replace(/[^\w\s]/g, ' ')
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Normalizes phone numbers to standard E.164-like clean format (just digits)
 * E.g., "+63 (917) 123-4567" -> "639171234567"
 * "0917-123-4567" -> "639171234567"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''

  // Keep only digits
  let digits = phone.replace(/\D/g, '')

  // Handle local PH format starting with 0 (e.g. 09171234567 -> 639171234567)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '63' + digits.substring(1)
  }

  // Handle mobile number missing country code (e.g. 9171234567 -> 639171234567)
  if (digits.length === 10 && (digits.startsWith('9') || digits.startsWith('2') || digits.startsWith('3'))) {
    digits = '63' + digits
  }

  return digits
}

/**
 * Normalizes website domains to ignore subdomains (e.g. www, m) and protocols
 * E.g., "https://www.abcdental.com/contact" -> "abcdental.com"
 */
export function normalizeDomain(url: string): string {
  if (!url) return ''

  let domain = url.trim().toLowerCase()

  // Remove protocol
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '')

  // Remove path and query params
  const slashIndex = domain.indexOf('/')
  if (slashIndex !== -1) {
    domain = domain.substring(0, slashIndex)
  }

  // Remove port if exists
  const colonIndex = domain.indexOf(':')
  if (colonIndex !== -1) {
    domain = domain.substring(0, colonIndex)
  }

  return domain
}
