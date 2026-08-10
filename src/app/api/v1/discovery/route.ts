import { NextResponse } from 'next/server'
import { discoveryQueue } from '../../../../lib/redis/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { category, barangay } = body

    if (!category || !barangay) {
      return NextResponse.json({ success: false, error: 'Category and Barangay are required.' }, { status: 400 })
    }

    // Queue the discovery job
    const job = await discoveryQueue.add(`discover-${category}-${barangay}`, {
      category,
      barangay,
    })

    return NextResponse.json({
      success: true,
      message: `Queued discovery job for ${category} in ${barangay}`,
      jobId: job.id,
    })
  } catch (error: any) {
    console.error('Error triggering discovery:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
