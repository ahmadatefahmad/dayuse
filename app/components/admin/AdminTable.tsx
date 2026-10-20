'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortValue = string | number | boolean | Date | null | undefined

export type Column<T> = {
  key: string
  header: string
  render?: (row: T) => ReactNode
  // Defaults to row[key]; supply this when render() shows something not directly sortable.
  sortValue?: (row: T) => SortValue
  sortable?: boolean
  className?: string
}

type AdminTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
}

function compare(a: SortValue, b: SortValue) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, undefined, { sensitivity: 'base' })
  return Number(a) - Number(b)
}

export function AdminTable<T>({ columns, data, rowKey, loading, emptyState, onRowClick }: AdminTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const rows = useMemo(() => {
    if (!sort) return data
    const column = columns.find((c) => c.key === sort.key)
    if (!column) return data
    const value = column.sortValue ?? ((row: T) => (row as Record<string, SortValue>)[column.key])
    const sorted = [...data].sort((a, b) => compare(value(a), value(b)))
    return sort.dir === 'asc' ? sorted : sorted.reverse()
  }, [data, columns, sort])

  function toggleSort(key: string) {
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-grey-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-grey-100 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
          <tr>
            {columns.map((col) => {
              const sortable = col.sortable !== false
              const SortIcon = sort?.key !== col.key ? ChevronsUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown
              return (
                <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                  {sortable ? (
                    <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 uppercase hover:text-navy">
                      {col.header}
                      <SortIcon className={cn('h-3.5 w-3.5', sort?.key === col.key ? 'text-coral' : 'text-grey-300')} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-grey-100">
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-grey-100" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-grey-50')}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-grey-700', col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && <div className="px-4 py-12 text-center text-sm text-grey-500">{emptyState ?? 'Nothing here yet.'}</div>}
    </div>
  )
}
