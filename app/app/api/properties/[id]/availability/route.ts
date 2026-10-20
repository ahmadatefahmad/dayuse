import { NextResponse, type NextRequest } from 'next/server'
import { handleApiError } from '@/lib/api'
import { checkAvailability } from '@/lib/availability'

export const dynamic = 'force-dynamic'

// GET ?date=YYYY-MM-DD&adults=2 -> { available, isBlackout, spotsLeft, reason? }
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const date = request.nextUrl.searchParams.get('date') ?? ''
  const adults = Number(request.nextUrl.searchParams.get('adults') ?? 1) || 1
  try {
    return NextResponse.json(await checkAvailability(params.id, date, adults))
  } catch (err) {
    return handleApiError(err)
  }
}
