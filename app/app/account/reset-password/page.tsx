import { requireAuth } from '@/lib/auth'
import { AuthCard } from '@/components/auth/AuthCard'
import { ResetPasswordForm } from '@/components/auth/PasswordForms'

export const metadata = { title: 'Choose a new password — DayUse Egypt' }
export const dynamic = 'force-dynamic'

// Outside the (public) account layout on purpose: a focused page right after the reset email.
export default async function ResetPasswordPage() {
  await requireAuth('/account/reset-password')
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm />
    </AuthCard>
  )
}
