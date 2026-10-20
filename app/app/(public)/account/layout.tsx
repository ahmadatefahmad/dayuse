import { ensureUserRecord } from '@/lib/account'
import { requireAuth } from '@/lib/auth'
import { AccountNav } from '@/components/account/AccountNav'

export const metadata = { title: 'My account — DayUse Egypt', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts already redirects signed-out visitors; this is the server-side guarantee.
  const user = await requireAuth('/account')
  const record = await ensureUserRecord(user)
  const firstName = record?.name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl text-navy sm:text-4xl">{firstName ? `Hi, ${firstName}` : 'My account'}</h1>
      <p className="mb-6 mt-1 text-sm text-grey-500">{user.email}</p>
      <AccountNav />
      <div className="pt-8">{children}</div>
    </div>
  )
}
