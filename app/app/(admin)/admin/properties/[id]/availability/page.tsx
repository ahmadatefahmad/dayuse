import prisma from '@/lib/prisma'
import { AvailabilityManager } from '@/components/admin/AvailabilityManager'
import { toDateString } from '@/lib/utils'

export default async function AvailabilityPage({ params }: { params: { id: string } }) {
  const [window, blackouts] = await Promise.all([
    prisma.availabilityWindow.findFirst({ where: { propertyId: params.id } }),
    prisma.blackoutDate.findMany({ where: { propertyId: params.id }, orderBy: { date: 'asc' } }),
  ])

  return (
    <AvailabilityManager
      propertyId={params.id}
      configured={Boolean(window)}
      initial={{
        startTime: window?.startTime ?? '09:00',
        endTime: window?.endTime ?? '18:00',
        maxCapacityAdults: window?.maxCapacityAdults,
        maxCapacityChildren: window?.maxCapacityChildren ?? 0,
        blackoutDates: blackouts.map((b) => ({ date: toDateString(b.date), reason: b.reason })),
      }}
    />
  )
}
