import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET() {
  try {
    const queue = await prisma.outreach.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        business: {
          include: {
            digitalPresence: true,
            opportunityAnalysis: true,
            contacts: true,
          }
        },
        contact: true
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, count: queue.length, queue })
  } catch (error: any) {
    console.error('Error fetching approval queue:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
