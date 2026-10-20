import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, safeNextPath } from '@/lib/auth'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata = { title: 'Create an account — DayUse Egypt' }
export const dynamic = 'force-dynamic'

export default async function RegisterPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNextPath(searchParams.next)
  if (await getCurrentUser()) redirect(next)
  return (
    <AuthCard
      title="Create your account"
      subtitle="Keep all your day passes, changes and reviews in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link href={`/login${searchParams.next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-coral hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthCard>
  )
}
