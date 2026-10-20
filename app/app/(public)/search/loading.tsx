import { PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true" aria-label="Loading results">
      <Skeleton className="mb-8 h-10 w-72" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
