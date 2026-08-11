import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/db'

// GET notes for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const business = await prisma.business.findUnique({
      where: { id },
      select: { notes: true },
    })
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, notes: business.notes ?? '' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH update notes for a business
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { notes } = await request.json()

    const updated = await prisma.business.update({
      where: { id },
      data: { notes },
    })

    // Log to audit_logs
    await prisma.auditLog.create({
      data: {
        action: 'NOTE_UPDATED',
        actor: 'USER',
        targetEntity: 'businesses',
        targetId: id,
        metadata: { noteLength: notes?.length ?? 0 },
      },
    })

    return NextResponse.json({ success: true, notes: updated.notes })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
