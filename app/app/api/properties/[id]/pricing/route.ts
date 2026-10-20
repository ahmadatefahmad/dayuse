import { NextResponse, type NextRequest } from 'next/server'
import { handleApiError, jsonError } from '@/lib/api'
import { getPricing } from '@/lib/availability'

export const dynamic = 'force-dynamic'

// GET ?date=YYYY-MM-DD&packageId=xxx -> { adultPrice, childPrice, source }
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const packageId = request.nextUrl.searchParams.get('packageId')
  if (!packageId) return jsonError('packageId is required', 400)
  try {
    const price = await getPricing(params.id, packageId, request.nextUrl.searchParams.get('date'))
    return price ? NextResponse.json(price) : jsonError('Package not found', 404)
  } catch (err) {
    return handleApiError(err)
  }
}
