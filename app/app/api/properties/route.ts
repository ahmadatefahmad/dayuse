import { NextResponse, type NextRequest } from 'next/server'
import { handleApiError } from '@/lib/api'
import { searchProperties } from '@/lib/queries/properties'
import { parseSearchParams } from '@/lib/search'

export const dynamic = 'force-dynamic'

// Public property search. Query: city, date, type, amenities, stars, sort, page, limit.
export async function GET(request: NextRequest) {
  const search = parseSearchParams(request.nextUrl.searchParams)
  try {
    const result = await searchProperties(search)
    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err)
  }
}
