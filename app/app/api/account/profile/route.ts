import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireUser } from '@/lib/api'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ProfileSchema } from '@/lib/validations/account'

// PATCH { name, phone, currentPassword?, newPassword? }
export async function PATCH(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  try {
    const input = ProfileSchema.parse(await request.json())
    const supabase = createSupabaseServerClient()

    if (input.newPassword) {
      // Prove it's really them before changing the password (e.g. on a shared, signed-in device).
      const { error } = await supabase.auth.signInWithPassword({ email: auth.email!, password: input.currentPassword })
      if (error) return jsonError('Your current password is incorrect.', 400)
      const { error: updateError } = await supabase.auth.updateUser({ password: input.newPassword })
      if (updateError) return jsonError(updateError.message, 400)
    }

    const user = await prisma.user.update({ where: { id: auth.id }, data: { name: input.name, phone: input.phone || null } })
    // Keep Supabase's copy in sync so a re-created User row gets the same details.
    await supabase.auth.updateUser({ data: { full_name: input.name, phone: input.phone } })
    return NextResponse.json({ name: user.name, phone: user.phone, passwordChanged: Boolean(input.newPassword) })
  } catch (err) {
    return handleApiError(err)
  }
}
