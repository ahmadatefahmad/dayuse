import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { handleApiError, requireAdmin, revalidatePublicPages } from '@/lib/api'

const ModerateSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().trim().max(1000).optional(),
})

// PATCH { action: 'approve' | 'reject', adminNote? } — approved reviews appear on the property page.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { action, adminNote } = ModerateSchema.parse(await request.json())
    const review = await prisma.review.update({
      where: { id: params.id },
      data: action === 'approve' ? { status: 'approved', adminNote: null } : { status: 'rejected', adminNote: adminNote || null },
    })
    // Ratings feed the property page and listing cards.
    revalidatePublicPages(review.propertyId)
    return NextResponse.json({ id: review.id, status: review.status, adminNote: review.adminNote })
  } catch (err) {
    return handleApiError(err)
  }
}
