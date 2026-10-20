'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { PackageForm } from '@/components/admin/PackageForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatEGP } from '@/lib/utils'
import type { PackageInput } from '@/lib/validations/property'

export type PackageItem = { id: string; values: PackageInput }

export function PackagesManager({ propertyId, items }: { propertyId: string; items: PackageItem[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(items.length ? null : 'new')

  const done = () => {
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {items.map(({ id, values: pkg }) =>
        editing === id ? (
          <PackageForm key={id} propertyId={propertyId} packageId={id} initial={pkg} onSaved={done} onCancel={() => setEditing(null)} />
        ) : (
          <div key={id} className="flex flex-col gap-4 rounded-xl border border-grey-100 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg text-navy">{pkg.name}</h3>
                {!pkg.active && <Badge>Inactive</Badge>}
              </div>
              <p className="text-sm text-grey-700">
                {formatEGP(pkg.adultPrice)} adult · {formatEGP(pkg.childPrice)} child{pkg.infantFree !== false && ' · infants free'}
              </p>
              {pkg.inclusions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pkg.inclusions.map((inc) => (
                    <span key={inc} className="rounded-full bg-grey-100 px-2.5 py-0.5 text-xs text-grey-700">
                      {inc}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-grey-500">
                {pkg.addOns.length} add-on{pkg.addOns.length === 1 ? '' : 's'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditing(id)} disabled={editing !== null}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        ),
      )}

      {editing === 'new' ? (
        <PackageForm propertyId={propertyId} onSaved={done} onCancel={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing('new')} disabled={editing !== null}>
          <Plus className="h-4 w-4" /> Add package
        </Button>
      )}
    </div>
  )
}
