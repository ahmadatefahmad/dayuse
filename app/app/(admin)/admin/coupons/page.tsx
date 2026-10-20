import { format, parseISO } from 'date-fns'
import prisma from '@/lib/prisma'
import { formatEGP, toCairoDateString } from '@/lib/utils'
import { CouponActiveToggle, NewCouponButton } from '@/components/admin/CouponManager'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/Badge'

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] })
  const now = new Date()

  return (
    <>
      <PageHeader title="Coupons" description="Discounts apply to the booking total before the online fee is calculated." actions={<NewCouponButton />} />
      <div className="overflow-x-auto rounded-xl border border-grey-100 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-grey-100 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Value</th>
              <th className="px-4 py-3 text-right font-medium">Min total</th>
              <th className="px-4 py-3 text-right font-medium">Uses</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {coupons.map((c) => {
              const expired = c.expiresAt !== null && c.expiresAt < now
              const usedUp = c.maxUses !== null && c.usedCount >= c.maxUses
              return (
                <tr key={c.id} className={c.active ? '' : 'text-grey-500'}>
                  <td className="px-4 py-3 font-mono font-semibold text-navy">{c.code}</td>
                  <td className="px-4 py-3">{c.type === 'percent' ? 'Percent' : 'Fixed'}</td>
                  <td className="px-4 py-3 text-right">{c.type === 'percent' ? `${c.value}%` : formatEGP(c.value)}</td>
                  <td className="px-4 py-3 text-right">{c.minBookingTotal ? formatEGP(c.minBookingTotal) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.usedCount}
                    {c.maxUses !== null && ` / ${c.maxUses}`}
                  </td>
                  {/* Stored as the first instant after the last valid day, so show the day before. */}
                  <td className="px-4 py-3">{c.expiresAt ? format(parseISO(toCairoDateString(new Date(c.expiresAt.getTime() - 1))), 'd MMM yyyy') : 'Never'}</td>
                  <td className="px-4 py-3">
                    {!c.active ? <Badge>Inactive</Badge> : expired ? <Badge tone="coral">Expired</Badge> : usedUp ? <Badge tone="coral">Used up</Badge> : <Badge tone="teal">Active</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CouponActiveToggle id={c.id} active={c.active} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="px-4 py-12 text-center text-sm text-grey-500">No coupons yet. Create one to run a promotion.</p>}
      </div>
    </>
  )
}
