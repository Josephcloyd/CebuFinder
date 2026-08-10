import { Anthropic } from '@anthropic-ai/sdk'

const globalForAI = global as unknown as { anthropic: Anthropic | undefined }

export const getAnthropicClient = (): Anthropic => {
  if (!globalForAI.anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not set. AI analysis will run in simulated mode.')
    }
    globalForAI.anthropic = new Anthropic({
      apiKey: apiKey || 'dummy-key',
    })
  }
  return globalForAI.anthropic
}

export interface AIOpportunityOutput {
  business_summary: string
  current_digital_presence: 'NONE' | 'FACEBOOK_ONLY' | 'OUTDATED_WEBSITE' | 'BROKEN_WEBSITE' | 'PARKED_DOMAIN' | 'MODERN_WEBSITE'
  primary_weakness: string
  primary_opportunity: string
  recommended_service:
    | 'CLINIC_APPOINTMENT_PORTAL'
    | 'RESTAURANT_DIGITAL_MENU_RESERVATION'
    | 'SALON_BOOKING_CATALOG'
    | 'CONTRACTOR_PORTFOLIO_LEAD_SITE'
    | 'REAL_ESTATE_LANDING_PAGE'
    | 'GYM_MEMBERSHIP_TRIAL_SITE'
    | 'LOCAL_SEO_BUSINESS_LANDING_PAGE'
  recommended_offer: string
  personalized_outreach_angle: string
  lead_score: number
  confidence_score: number
  draft_outreach_email: {
    subject: string
    body_plain_text: string
  }
}

/**
 * Invokes Claude 3.5 Haiku to perform a digital audit opportunity analysis.
 */
export async function analyzeOpportunity(
  businessName: string,
  category: string,
  barangay: string,
  auditData: Record<string, any>
): Promise<AIOpportunityOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return generateSimulatedAnalysis(businessName, category, barangay, auditData)
  }

  const client = getAnthropicClient()

  const systemPrompt = `You are a B2B Digital Transformation Expert consulting for SMEs in Cebu City, Philippines.
Your task is to analyze a business's local profile and website audit data to determine digital services they desperately need.

OUTPUT INSTRUCTIONS:
You MUST respond with a single, valid JSON object matching the JSON schema below.
No conversational intro, no markdown code blocks (e.g. \`\`\`json), no trailing text. Only the raw JSON.

JSON SCHEMA:
{
  "business_summary": "2-sentence overview of the business operations in Cebu.",
  "current_digital_presence": "NONE" | "FACEBOOK_ONLY" | "OUTDATED_WEBSITE" | "BROKEN_WEBSITE" | "PARKED_DOMAIN" | "MODERN_WEBSITE",
  "primary_weakness": "The main technical or marketing deficiency observed.",
  "primary_opportunity": "The highest value digital upgrade for this specific business type.",
  "recommended_service": "CLINIC_APPOINTMENT_PORTAL" | "RESTAURANT_DIGITAL_MENU_RESERVATION" | "SALON_BOOKING_CATALOG" | "CONTRACTOR_PORTFOLIO_LEAD_SITE" | "REAL_ESTATE_LANDING_PAGE" | "GYM_MEMBERSHIP_TRIAL_SITE" | "LOCAL_SEO_BUSINESS_LANDING_PAGE",
  "recommended_offer": "Specific value proposition package tailored for this lead.",
  "personalized_outreach_angle": "The specific hook connecting their business context to the offer.",
  "lead_score": 0 to 100 integer matching the severity of their digital need and reachability,
  "confidence_score": 0.0 to 1.0 rating based on data quality,
  "draft_outreach_email": {
    "subject": "Email subject line under 60 chars. Explicitly mention their business name and Barangay.",
    "body_plain_text": "Personalized, polite, non-salesy email draft under 150 words. Do NOT claim you visited their physical shop unless you did. Focus on the core value proposition and offer a free mockup. Include opt-out mention."
  }
}`

  const userContent = `Analyze this Cebu City business:
Name: ${businessName}
Category: ${category}
Barangay: ${barangay}

Website Audit Findings:
${JSON.stringify(auditData, null, 2)}`

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.1, // High determinism
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    
    // Clean up potential markdown formatting if Claude returned it anyway
    const jsonStart = responseText.indexOf('{')
    const jsonEnd = responseText.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`Failed to parse JSON output from response: ${responseText}`)
    }
    const cleanJson = responseText.substring(jsonStart, jsonEnd + 1)
    
    const parsed: AIOpportunityOutput = JSON.parse(cleanJson)
    return parsed
  } catch (error: any) {
    console.error('Claude API opportunity analysis error:', error.message)
    // Fallback to simulated in case of failure
    return generateSimulatedAnalysis(businessName, category, barangay, auditData)
  }
}

/**
 * Returns a high-quality simulated analysis for testing.
 */
function generateSimulatedAnalysis(
  name: string,
  category: string,
  barangay: string,
  auditData: Record<string, any>
): AIOpportunityOutput {
  console.log(`[Simulated AI Analysis] Analyzing "${name}"...`)
  
  let recommendedService: AIOpportunityOutput['recommended_service'] = 'LOCAL_SEO_BUSINESS_LANDING_PAGE'
  let recommendedOffer = 'Custom modern website with Local SEO setup.'
  let primaryWeakness = 'No dedicated website.'
  let primaryOpportunity = 'Creating a high-converting landing page.'
  let currentPresence: AIOpportunityOutput['current_digital_presence'] = 'NONE'

  if (auditData.websiteStatus === 'FACEBOOK_ONLY' || !auditData.websiteUrl) {
    currentPresence = 'FACEBOOK_ONLY'
  } else if (auditData.websiteStatus === 'OUTDATED_SITE') {
    currentPresence = 'OUTDATED_WEBSITE'
  } else if (auditData.websiteStatus === 'BROKEN_SITE') {
    currentPresence = 'BROKEN_WEBSITE'
  }

  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('dental') || categoryLower.includes('medical') || categoryLower.includes('clinic')) {
    recommendedService = 'CLINIC_APPOINTMENT_PORTAL'
    recommendedOffer = 'Mobile-friendly clinic website with services, doctor profiles, and appointment request form.'
    primaryWeakness = currentPresence === 'FACEBOOK_ONLY' 
      ? 'Relies purely on Facebook Messenger for clinic appointments, which lacks structure.' 
      : 'Outdated website that does not support patient self-scheduling.'
    primaryOpportunity = 'A simple appointment booking funnel for dental patients in Cebu.'
  } else if (categoryLower.includes('restaurant') || categoryLower.includes('cafe')) {
    recommendedService = 'RESTAURANT_DIGITAL_MENU_RESERVATION'
    recommendedOffer = 'QR code digital menu with table booking and WhatsApp ordering integration.'
    primaryWeakness = 'Lacks a structured digital menu and table reservation platform.'
    primaryOpportunity = 'Enabling online reservations and interactive menu viewing for diners.'
  } else if (categoryLower.includes('salon') || categoryLower.includes('barber')) {
    recommendedService = 'SALON_BOOKING_CATALOG'
    recommendedOffer = 'Visual service catalog with automated booking system and SMS reminder triggers.'
    primaryWeakness = 'Relies on manual DM booking which creates double-bookings and friction.'
    primaryOpportunity = 'An automated beauty scheduling portal for clients in Cebu.'
  }

  return {
    business_summary: `${name} is a local ${category} operating in Barangay ${barangay}, Cebu City. They provide essential services to the local community.`,
    current_digital_presence: currentPresence,
    primary_weakness: primaryWeakness,
    primary_opportunity: primaryOpportunity,
    recommended_service: recommendedService,
    recommended_offer: recommendedOffer,
    personalized_outreach_angle: `Connecting with ${name} to help streamline their customer acquisition in ${barangay} through an optimized ${recommendedService.replace(/_/g, ' ').toLowerCase()}.`,
    lead_score: 85,
    confidence_score: 0.9,
    draft_outreach_email: {
      subject: `Quick proposal for ${name} in ${barangay}`,
      body_plain_text: `Hi ${name} team,\n\nI was looking up ${categoryLower} options in ${barangay} and found your page. I noticed patients don't have an easy way to view your services and request bookings online. I put together a quick mockup of a simple, mobile-friendly appointment site for your clinic.\n\nWould you be open to checking out the mockup? No strings attached.\n\nBest regards,\nCebu Digital Hub Team\n\n(Reply STOP to unsubscribe from future messages)`
    }
  }
}
