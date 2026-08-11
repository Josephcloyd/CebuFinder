import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch audit logs for this business
    const auditLogs = await prisma.auditLog.findMany({
      where: { targetId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Fetch outreach events linked to this business
    const outreach = await prisma.outreach.findMany({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        status: true,
        channel: true,
        createdAt: true,
        sentAt: true,
        repliedAt: true,
      },
    })

    // Fetch the business itself for discovery date
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        dateDiscovered: true,
        discoverySource: true,
        digitalPresence: { select: { auditedAt: true, websiteStatus: true } },
      },
    })

    // Build unified timeline events
    const events: any[] = []

    // Discovery event
    if (business) {
      events.push({
        id: `discovery-${id}`,
        type: 'DISCOVERED',
        label: `Business discovered via ${business.discoverySource}`,
        icon: '📍',
        color: 'purple',
        timestamp: business.dateDiscovered,
      })
    }

    // Audit event
    if (business?.digitalPresence) {
      events.push({
        id: `audit-${id}`,
        type: 'AUDITED',
        label: `Digital audit completed — Status: ${business.digitalPresence.websiteStatus.replace(/_/g, ' ')}`,
        icon: '🔍',
        color: 'blue',
        timestamp: business.digitalPresence.auditedAt,
      })
    }

    // Outreach events
    for (const o of outreach) {
      events.push({
        id: `outreach-created-${o.id}`,
        type: 'PITCH_DRAFTED',
        label: `Pitch drafted: "${o.subject}" (${o.channel})`,
        icon: '✍️',
        color: 'indigo',
        timestamp: o.createdAt,
      })
      if (o.sentAt) {
        events.push({
          id: `outreach-sent-${o.id}`,
          type: 'CONTACTED',
          label: `Email sent: "${o.subject}"`,
          icon: '✉️',
          color: 'emerald',
          timestamp: o.sentAt,
        })
      }
      if (o.repliedAt) {
        events.push({
          id: `outreach-replied-${o.id}`,
          type: 'REPLIED',
          label: `Reply received for: "${o.subject}"`,
          icon: '💬',
          color: 'green',
          timestamp: o.repliedAt,
        })
      }
    }

    // Audit log events
    for (const log of auditLogs) {
      if (log.action === 'NOTE_UPDATED') {
        events.push({
          id: log.id,
          type: 'NOTE_ADDED',
          label: 'Note updated',
          icon: '📝',
          color: 'amber',
          timestamp: log.createdAt,
        })
      } else if (log.action === 'STAGE_MOVED') {
        const meta = log.metadata as any
        events.push({
          id: log.id,
          type: 'STAGE_MOVED',
          label: `Pipeline stage changed to ${(meta?.toStage || '').replace(/_/g, ' ')}`,
          icon: '📊',
          color: 'purple',
          timestamp: log.createdAt,
        })
      } else {
        events.push({
          id: log.id,
          type: log.action,
          label: log.action.replace(/_/g, ' '),
          icon: '🔔',
          color: 'zinc',
          timestamp: log.createdAt,
        })
      }
    }

    // Sort all events newest-first
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    console.error('Timeline error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
