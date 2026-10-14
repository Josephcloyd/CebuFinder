import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'
import { getErrorMessage } from '../../../../../lib/utils/errors'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const scan = await prisma.discoveryScan.findUnique({ where: { id: jobId } })

    if (!scan) {
      return NextResponse.json({ success: false, error: 'Scan not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, scan }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
