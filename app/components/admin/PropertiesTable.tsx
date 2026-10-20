'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { AdminTable, type Column } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'
import { PROPERTY_TYPE_LABELS } from '@/lib/validations/property'

type PropertyRow = {
  id: string
  name: string
  slug: string
  city: string
  type: keyof typeof PROPERTY_TYPE_LABELS
  coverImage: string
  active: boolean
  updatedAt: string
  _count: { packages: number }
}

const columns: Column<PropertyRow>[] = [
  {
    key: 'name',
    header: 'Property',
    render: (p) => (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails come from arbitrary hosts */}
        <img src={p.coverImage} alt="" className="h-10 w-14 shrink-0 rounded-md bg-grey-100 object-cover" />
        <div className="min-w-0">
          <p className="truncate font-medium text-navy">{p.name}</p>
          <p className="truncate text-xs text-grey-500">/{p.slug}</p>
        </div>
      </div>
    ),
  },
  { key: 'city', header: 'City' },
  { key: 'type', header: 'Type', render: (p) => PROPERTY_TYPE_LABELS[p.type] ?? p.type },
  { key: 'packages', header: 'Packages', sortValue: (p) => p._count.packages, render: (p) => p._count.packages },
  { key: 'active', header: 'Status', render: (p) => (p.active ? <Badge tone="teal">Active</Badge> : <Badge>Inactive</Badge>) },
  { key: 'updatedAt', header: 'Updated', sortValue: (p) => p.updatedAt, render: (p) => format(new Date(p.updatedAt), 'd MMM yyyy') },
]

export function PropertiesTable() {
  const router = useRouter()
  const [rows, setRows] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiFetch<PropertyRow[]>('/api/admin/properties')
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => `${r.name} ${r.city} ${r.slug}`.toLowerCase().includes(q)) : rows
  }, [rows, query])

  if (error) return <p className="rounded-lg bg-coral/10 p-4 text-sm text-coral">Couldn&apos;t load properties: {error}</p>

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-500" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or city" className="pl-9" />
      </div>
      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        loading={loading}
        onRowClick={(r) => router.push(`/admin/properties/${r.id}`)}
        emptyState={
          query ? (
            'No properties match your search.'
          ) : (
            <div className="space-y-3">
              <p>No properties yet.</p>
              <Link href="/admin/properties/new" className={buttonClasses('primary', 'sm')}>
                Add your first property
              </Link>
            </div>
          )
        }
      />
    </div>
  )
}
