import { z } from 'zod'

// Enums matching Prisma schema
export const DiscoverySourceSchema = z.enum([
  'OSM_OVERPASS',
  'GOOGLE_SEARCH_API',
  'BING_SEARCH_API',
  'MANUAL_ENTRY',
])

export const WebsiteStatusSchema = z.enum([
  'NO_WEBSITE',
  'FACEBOOK_ONLY',
  'PARKED_DOMAIN',
  'OUTDATED_SITE',
  'BROKEN_SITE',
  'FULLY_FUNCTIONAL',
])

export const ContactTypeSchema = z.enum([
  'BUSINESS_EMAIL',
  'BUSINESS_PHONE',
  'FACEBOOK_MESSENGER',
  'WHATSAPP',
  'VIBER',
])

export const OutreachStatusSchema = z.enum([
  'DRAFTED',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'QUEUED',
  'SENT',
  'FAILED',
  'REPLIED',
  'OPTED_OUT',
])

// Zod validation schemas for models
export const BusinessSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Business name is required'),
  normalizedName: z.string().optional(),
  businessCategory: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  barangay: z.string().min(1, 'Barangay is required'),
  city: z.string().default('Cebu City'),
  province: z.string().default('Cebu'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  discoverySource: DiscoverySourceSchema,
  sourceUrl: z.string().url('Invalid source URL').optional().nullable(),
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  establishedYearSource: z.string().optional().nullable(),
  dateDiscovered: z.date().optional(),
  dateLastChecked: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const CreateBusinessSchema = BusinessSchema.omit({
  id: true,
  normalizedName: true,
  createdAt: true,
  updatedAt: true,
})

export const DigitalPresenceSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable(),
  websiteStatus: WebsiteStatusSchema.default('NO_WEBSITE'),
  httpStatusCode: z.number().int().optional().nullable(),
  hasSsl: z.boolean().default(false),
  isMobileResponsive: z.boolean().default(false),
  facebookUrl: z.string().url('Invalid Facebook URL').optional().nullable(),
  instagramUrl: z.string().url('Invalid Instagram URL').optional().nullable(),
  hasOnlineBooking: z.boolean().default(false),
  hasEcommerce: z.boolean().default(false),
  detectedTechnologies: z.array(z.string()).default([]),
  rawAuditData: z.record(z.string(), z.any()).default({}),
  auditedAt: z.date().optional(),
})

export const ContactSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  contactType: ContactTypeSchema,
  contactValue: z.string().min(1, 'Contact value is required'),
  sourceUrl: z.string().url().optional().nullable(),
  verificationStatus: z.string().default('UNVERIFIED'),
  doNotContact: z.boolean().default(false),
  lastVerified: z.date().optional().nullable(),
  createdAt: z.date().optional(),
})

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
})

export const OpportunityAnalysisSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  primaryProblem: z.string().min(1, 'Primary problem description is required'),
  recommendedService: z.string().min(1, 'Recommended service is required'),
  opportunitySummary: z.string().min(1, 'Opportunity summary is required'),
  recommendedOffer: z.string().min(1, 'Recommended offer is required'),
  leadScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().min(0.0).max(1.0),
  aiModel: z.string().min(1, 'AI model name is required'),
  analysisRawJson: z.record(z.string(), z.any()),
  analyzedAt: z.date().optional(),
})

export const OutreachSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  contactId: z.string().uuid().optional().nullable(),
  channel: z.string().default('EMAIL'),
  subject: z.string().min(1, 'Subject is required'),
  messageBody: z.string().min(1, 'Message body is required'),
  status: OutreachStatusSchema.default('PENDING_APPROVAL'),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.date().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  sentAt: z.date().optional().nullable(),
  resendMessageId: z.string().optional().nullable(),
  repliedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
})

export const FollowupSchema = z.object({
  id: z.string().uuid().optional(),
  outreachId: z.string().uuid(),
  stepNumber: z.number().int().positive(),
  scheduledAt: z.date(),
  status: z.string().default('SCHEDULED'),
  subject: z.string().min(1, 'Subject is required'),
  messageBody: z.string().min(1, 'Message body is required'),
  sentAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
})

export const SuppressionListSchema = z.object({
  id: z.string().uuid().optional(),
  contactValue: z.string().min(1, 'Contact value is required'),
  reason: z.string().min(1, 'Reason is required'),
  source: z.string().default('USER_OPT_OUT'),
  dateAdded: z.date().optional(),
})

export const AuditLogSchema = z.object({
  id: z.string().uuid().optional(),
  action: z.string().min(1, 'Action is required'),
  actor: z.string().min(1, 'Actor is required'),
  targetEntity: z.string().min(1, 'Target entity is required'),
  targetId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().optional(),
})
