import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { ForgotPasswordForm } from '@/components/auth/PasswordForms'

export const metadata = { title: 'Reset your password — DayUse Egypt' }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Link href="/login" className="font-medium text-coral hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
