import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

// GET /api/v1/leads/[id] — Full business detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        digitalPresence: true,
        contacts: { orderBy: { createdAt: 'asc' } },
        opportunityAnalysis: true,
        outreach: {
          orderBy: { createdAt: 'desc' },
          include: {
            contact: { select: { contactType: true, contactValue: true } },
            followups: { orderBy: { scheduledAt: 'asc' } },
          },
        },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, business })
  } catch (error: any) {
    console.error('Lead detail error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH /api/v1/leads/[id] — Update editable business facts.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const establishedYear = body.establishedYear === null || body.establishedYear === ''
      ? null
      : Number(body.establishedYear)
    const currentYear = new Date().getFullYear()

    if (establishedYear !== null && (!Number.isInteger(establishedYear) || establishedYear < 1800 || establishedYear > currentYear)) {
      return NextResponse.json({ success: false, error: `Established year must be between 1800 and ${currentYear}` }, { status: 400 })
    }

    const business = await prisma.business.update({
      where: { id },
      data: {
        establishedYear,
        establishedYearSource: establishedYear ? 'Manually confirmed' : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'BUSINESS_ESTABLISHED_YEAR_UPDATED',
        actor: 'USER',
        targetEntity: 'businesses',
        targetId: id,
        metadata: { establishedYear },
      },
    })

    return NextResponse.json({ success: true, business })
  } catch (error: any) {
    console.error('Lead update error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/v1/leads/[id] — Delete business and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.business.findUnique({
      where: { id },
      select: { id: true, name: true, barangay: true },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Delete business (Prisma schema cascade will delete digitalPresence, contacts, opportunityAnalysis, outreach, followups)
    await prisma.business.delete({
      where: { id },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'BUSINESS_DELETED',
        actor: 'USER',
        targetEntity: 'businesses',
        targetId: id,
        metadata: { name: existing.name, barangay: existing.barangay },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted "${existing.name}" and all associated data.`,
    })
  } catch (error: any) {
    console.error('Lead delete error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

