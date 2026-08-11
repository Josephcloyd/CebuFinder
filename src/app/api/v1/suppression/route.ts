import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET() {
  try {
    const list = await prisma.suppressionList.findMany({
      orderBy: { dateAdded: 'desc' },
    })
    return NextResponse.json({ success: true, count: list.length, list })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contactValue, reason } = body

    if (!contactValue || !reason) {
      return NextResponse.json({ success: false, error: 'contactValue and reason are required' }, { status: 400 })
    }

    const valueLower = contactValue.trim().toLowerCase()

    const item = await prisma.suppressionList.upsert({
      where: { contactValue: valueLower },
      update: { reason },
      create: {
        contactValue: valueLower,
        reason,
        source: 'DASHBOARD_MANUAL'
      }
    })

    // Also mark any matching existing contacts as doNotContact
    await prisma.contact.updateMany({
      where: { contactValue: { equals: valueLower, mode: 'insensitive' } },
      data: { doNotContact: true }
    })

    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
    }

    await prisma.suppressionList.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Removed from suppression list' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
