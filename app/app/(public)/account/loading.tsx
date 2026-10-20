import { Skeleton } from '@/components/ui/Skeleton'

// Shown inside the account layout (heading + tabs stay put) while a tab loads.
export default function AccountLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  )
}
