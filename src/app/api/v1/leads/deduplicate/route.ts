import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

// POST /api/v1/leads/deduplicate — Finds and removes repeating duplicate businesses
export async function POST() {
  try {
    // Group businesses by normalizedName + barangay
    const allBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        normalizedName: true,
        barangay: true,
        createdAt: true,
        contacts: { select: { id: true } },
        opportunityAnalysis: { select: { leadScore: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const groups: Record<string, typeof allBusinesses> = {}

    for (const b of allBusinesses) {
      const key = `${b.normalizedName.toLowerCase().trim()}|${b.barangay.toLowerCase().trim()}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(b)
    }

    const idsToDelete: string[] = []
    let duplicateGroupsCount = 0

    for (const [_, items] of Object.entries(groups)) {
      if (items.length > 1) {
        duplicateGroupsCount++
        // Sort to pick the BEST record to keep (one with contacts, highest score, or newest)
        items.sort((a, b) => {
          const aContacts = a.contacts.length
          const bContacts = b.contacts.length
          if (aContacts !== bContacts) return bContacts - aContacts

          const aScore = a.opportunityAnalysis?.leadScore ?? 0
          const bScore = b.opportunityAnalysis?.leadScore ?? 0
          if (aScore !== bScore) return bScore - aScore

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        // Keep the first (best), mark the rest for deletion
        const [keep, ...duplicates] = items
        for (const dup of duplicates) {
          idsToDelete.push(dup.id)
        }
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.business.deleteMany({
        where: { id: { in: idsToDelete } },
      })

      await prisma.auditLog.create({
        data: {
          action: 'BULK_DEDUPLICATION',
          actor: 'USER',
          targetEntity: 'businesses',
          metadata: { deletedCount: idsToDelete.length, duplicateGroupsCount },
        },
      })
    }

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      duplicateGroupsCount,
      message: idsToDelete.length > 0
        ? `Cleaned up ${idsToDelete.length} duplicate business record(s) across ${duplicateGroupsCount} group(s).`
        : 'No duplicate businesses found. Your database is already clean!',
    })
  } catch (error: any) {
    console.error('Deduplication error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
