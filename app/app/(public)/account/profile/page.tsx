import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ProfileForm } from '@/components/account/ProfileForm'

export default async function ProfilePage({ searchParams }: { searchParams: { password?: string } }) {
  const user = await requireAuth('/account/profile')
  const record = await prisma.user.findUnique({ where: { id: user.id } })

  return (
    <div className="space-y-4">
      {searchParams.password === 'updated' && <p className="rounded-lg bg-teal/10 p-4 text-sm text-teal">Your new password is saved.</p>}
      <ProfileForm email={user.email ?? ''} name={record?.name ?? ''} phone={record?.phone ?? ''} />
    </div>
  )
}
