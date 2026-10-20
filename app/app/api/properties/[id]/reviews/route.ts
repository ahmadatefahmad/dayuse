import { NextResponse, type NextRequest } from 'next/server'
import { handleApiError } from '@/lib/api'
import { getReviews, REVIEWS_PAGE_SIZE } from '@/lib/queries/reviews'

export const dynamic = 'force-dynamic'

// GET ?page=1&limit=5 -> approved reviews, newest first
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const page = Math.max(Number.parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '', 10) || REVIEWS_PAGE_SIZE, 1), 20)
  try {
    return NextResponse.json(await getReviews(params.id, page, limit))
  } catch (err) {
    return handleApiError(err)
  }
}
