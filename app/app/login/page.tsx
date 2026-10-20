import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin, safeNextPath } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase-server'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Sign in — DayUse Egypt' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: { next?: string; redirect?: string; error?: string } }

const NOTICES: Record<string, string> = {
  link_expired: 'That link has expired or was already used. Please try again.',
  session_expired: 'Your session has expired. Please sign in again to continue.',
}

export default async function LoginPage({ searchParams }: Props) {
  // ?redirect= is accepted as an alias of ?next=.
  const next = safeNextPath(searchParams.next ?? searchParams.redirect)
  const notAdmin = searchParams.error === 'not_admin'
  const user = await getCurrentUser()
  // Already signed in: carry on, unless the admin guard just bounced a non-admin here.
  if (user && (isAdmin(user) || !notAdmin)) redirect(next)

  const registerHref = `/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage your bookings and reviews."
      footer={
        <>
          New to DayUse?{' '}
          <Link href={registerHref} className="font-medium text-coral hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {searchParams.error && NOTICES[searchParams.error] && <p className="mb-4 rounded-lg bg-coral/10 p-3 text-sm text-coral">{NOTICES[searchParams.error]}</p>}
      {!isSupabaseConfigured() ? (
        <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">
          Supabase isn&apos;t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart the dev server.
        </p>
      ) : (
        <LoginForm next={next} signedInAs={user?.email ?? null} notAdmin={notAdmin} />
      )}
    </AuthCard>
  )
}
