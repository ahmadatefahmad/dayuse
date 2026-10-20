import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { DesktopOnly } from '@/components/admin/DesktopOnly'

export const metadata = { title: 'Admin — DayUse Egypt' }
// Never prerender admin pages: the auth check and live data must run on every request.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/dashboard')
  if (!isAdmin(user)) redirect('/login?error=not_admin')

  return (
    <DesktopOnly>
      <div className="min-h-screen bg-grey-50 md:flex">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <header className="flex h-14 items-center justify-between border-b border-grey-100 bg-white px-4 md:px-8">
            <span className="text-sm font-medium text-navy">Admin</span>
            <span className="truncate text-sm text-grey-500">{user.email}</span>
          </header>
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </DesktopOnly>
  )
}
