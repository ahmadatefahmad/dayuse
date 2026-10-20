'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { FormSection } from '@/components/admin/FormSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'
import { cn, formatEGP, fromDateString, todayInEgypt } from '@/lib/utils'

export type PricingPackage = { id: string; name: string; adultPrice: number; childPrice: number; active: boolean }
export type PricingRule = { packageId: string | null; dayOfWeek: number | null; date: string | null; adultPrice: number; childPrice: number }

// dayOfWeek follows JS Date: 0 = Sunday. Friday and Saturday are the Egyptian weekend.
const DAYS = [
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday', weekend: true },
  { dow: 6, label: 'Saturday', weekend: true },
  { dow: 0, label: 'Sunday' },
]

type PriceDraft = { adult: string; child: string }
type OverrideDraft = PriceDraft & { date: string }

export function PricingManager({ propertyId, packages, rules }: { propertyId: string; packages: PricingPackage[]; rules: PricingRule[] }) {
  const [selected, setSelected] = useState(packages[0].id)
  const pkg = packages.find((p) => p.id === selected)!

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {packages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition-colors',
              p.id === selected ? 'border-coral bg-coral text-white' : 'border-grey-300 bg-white text-grey-700 hover:border-navy',
            )}
          >
            {p.name}
            {!p.active && ' (inactive)'}
          </button>
        ))}
      </div>
      <PackagePricingEditor key={pkg.id} propertyId={propertyId} pkg={pkg} rules={rules.filter((r) => r.packageId === pkg.id)} />
    </div>
  )
}

const toDraft = (r: { adultPrice: number; childPrice: number }): PriceDraft => ({ adult: String(r.adultPrice), child: String(r.childPrice) })

function PackagePricingEditor({ propertyId, pkg, rules }: { propertyId: string; pkg: PricingPackage; rules: PricingRule[] }) {
  const router = useRouter()
  const [days, setDays] = useState<Record<number, PriceDraft>>(() =>
    Object.fromEntries(rules.filter((r) => r.dayOfWeek !== null).map((r) => [r.dayOfWeek, toDraft(r)])),
  )
  const [overrides, setOverrides] = useState<OverrideDraft[]>(() =>
    rules
      .filter((r) => r.date)
      .map((r) => ({ date: r.date!, ...toDraft(r) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  )
  const [draft, setDraft] = useState<OverrideDraft>({ date: '', adult: '', child: '' })
  const [status, setStatus] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const setDay = (dow: number, key: keyof PriceDraft, value: string) => {
    setStatus(null)
    setDays((d) => ({ ...d, [dow]: { ...(d[dow] ?? { adult: '', child: '' }), [key]: value } }))
  }

  // Blank cells fall back to the package's base price.
  const resolve = (value: string, fallback: number) => (value.trim() === '' ? fallback : Number(value))

  function addOverride() {
    if (!draft.date) return setStatus({ tone: 'error', text: 'Pick a date for the override.' })
    if (overrides.some((o) => o.date === draft.date)) return setStatus({ tone: 'error', text: 'That date already has an override.' })
    setOverrides((o) => [...o, draft].sort((a, b) => a.date.localeCompare(b.date)))
    setDraft({ date: '', adult: '', child: '' })
    setStatus(null)
  }

  async function save() {
    const dayRows = DAYS.flatMap(({ dow }) => {
      const d = days[dow]
      if (!d || (d.adult.trim() === '' && d.child.trim() === '')) return []
      return [{ dayOfWeek: dow, adultPrice: resolve(d.adult, pkg.adultPrice), childPrice: resolve(d.child, pkg.childPrice) }]
    })
    const overrideRows = overrides.map((o) => ({ date: o.date, adultPrice: resolve(o.adult, pkg.adultPrice), childPrice: resolve(o.child, pkg.childPrice) }))
    if ([...dayRows, ...overrideRows].some((r) => !(r.adultPrice >= 0) || !(r.childPrice >= 0))) {
      return setStatus({ tone: 'error', text: 'Prices must be zero or more.' })
    }

    setSaving(true)
    try {
      await apiFetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'POST',
        json: { packageId: pkg.id, days: dayRows, overrides: overrideRows },
      })
      setStatus({ tone: 'ok', text: 'Pricing saved' })
      router.refresh()
    } catch (e) {
      setStatus({ tone: 'error', text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const base = `Base: ${formatEGP(pkg.adultPrice)} adult · ${formatEGP(pkg.childPrice)} child`

  return (
    <div className="space-y-6">
      <FormSection title="Day-of-week prices" description={`Leave a cell blank to use the package base price. ${base}.`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-grey-500">
              <tr>
                <th className="pb-2 font-medium">Day</th>
                <th className="pb-2 font-medium">Adult (EGP)</th>
                <th className="pb-2 font-medium">Child (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {DAYS.map(({ dow, label, weekend }) => (
                <tr key={dow}>
                  <td className="py-2 pr-4 text-navy">
                    {label} {weekend && <Badge tone="coral">Weekend</Badge>}
                  </td>
                  <td className="py-2 pr-3">
                    <Input type="number" min={0} step="any" placeholder={String(pkg.adultPrice)} value={days[dow]?.adult ?? ''} onChange={(e) => setDay(dow, 'adult', e.target.value)} aria-label={`${label} adult price`} />
                  </td>
                  <td className="py-2">
                    <Input type="number" min={0} step="any" placeholder={String(pkg.childPrice)} value={days[dow]?.child ?? ''} onChange={(e) => setDay(dow, 'child', e.target.value)} aria-label={`${label} child price`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>

      <FormSection title="Date overrides" description="Holidays and peak days. An override always wins over the day-of-week price.">
        {overrides.length > 0 && (
          <ul className="divide-y divide-grey-100 rounded-lg border border-grey-100">
            {overrides.map((o) => (
              <li key={o.date} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 sm:grid-cols-[180px_1fr_1fr_auto]">
                <span className="font-medium text-navy">{format(fromDateString(o.date), 'EEE d MMM yyyy')}</span>
                <span className="text-grey-700 max-sm:hidden">Adult {formatEGP(resolve(o.adult, pkg.adultPrice))}</span>
                <span className="text-grey-700 max-sm:hidden">Child {formatEGP(resolve(o.child, pkg.childPrice))}</span>
                <Button variant="ghost" size="sm" aria-label="Remove override" onClick={() => setOverrides((all) => all.filter((x) => x.date !== o.date))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-[180px_1fr_1fr_auto]">
          <Input type="date" min={todayInEgypt()} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} aria-label="Override date" />
          <Input type="number" min={0} step="any" placeholder={`Adult (${pkg.adultPrice})`} value={draft.adult} onChange={(e) => setDraft({ ...draft, adult: e.target.value })} aria-label="Override adult price" />
          <Input type="number" min={0} step="any" placeholder={`Child (${pkg.childPrice})`} value={draft.child} onChange={(e) => setDraft({ ...draft, child: e.target.value })} aria-label="Override child price" />
          <Button variant="secondary" onClick={addOverride}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        {status && <p className={cn('mr-auto text-sm', status.tone === 'ok' ? 'text-teal' : 'text-red-600')}>{status.text}</p>}
        <Button onClick={save} loading={saving}>
          Save pricing for {pkg.name}
        </Button>
      </div>
    </div>
  )
}
