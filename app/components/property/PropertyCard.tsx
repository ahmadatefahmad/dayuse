import Link from 'next/link'
import { Star } from 'lucide-react'
import { AMENITY_ICONS } from '@/components/property/amenities'
import { PropertyImage } from '@/components/property/PropertyImage'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PropertyCardData } from '@/lib/search'
import { formatEGP } from '@/lib/utils'
import { PROPERTY_TYPE_LABELS } from '@/lib/validations/property'

const TYPE_TONES: Record<string, BadgeTone> = { hotel: 'solid-navy', beach_club: 'solid-teal', resort: 'solid-coral' }

export function PropertyCard({ property: p, priority = false }: { property: PropertyCardData; priority?: boolean }) {
  const amenities = p.amenities.filter((a) => AMENITY_ICONS[a]).slice(0, 3)

  return (
    <Link
      href={`/property/${p.id}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-grey-100 transition-shadow duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-grey-100">
        <PropertyImage
          src={p.coverImage}
          alt={p.name}
          priority={priority}
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
        <Badge tone={TYPE_TONES[p.type] ?? 'solid-navy'} className="absolute left-3 top-3">
          {PROPERTY_TYPE_LABELS[p.type as keyof typeof PROPERTY_TYPE_LABELS] ?? p.type}
        </Badge>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          {p.stars ? (
            <div className="mb-1 flex gap-0.5" aria-label={`${p.stars}-star`}>
              {Array.from({ length: p.stars }, (_, i) => (
                <Star key={i} className="h-3 w-3 fill-sand text-sand" />
              ))}
            </div>
          ) : null}
          <h3 className="font-playfair text-xl leading-tight">{p.name}</h3>
          <p className="mt-0.5 text-sm text-white/80">{p.area ? `${p.area}, ${p.city}` : p.city}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-grey-500">
          From <span className="text-base font-semibold text-navy">{formatEGP(p.minPrice)}</span> / person
        </p>
        <div className="flex shrink-0 items-center gap-2 text-grey-500">
          {p.rating !== null && (
            <span className="flex items-center gap-1 text-xs font-medium text-navy" title={`${p.reviewCount} reviews`}>
              <Star className="h-3.5 w-3.5 fill-coral text-coral" />
              {p.rating.toFixed(1)}
            </span>
          )}
          {amenities.map((a) => {
            const Icon = AMENITY_ICONS[a]
            return <Icon key={a} className="h-4 w-4" aria-label={a} />
          })}
        </div>
      </div>
    </Link>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-grey-100">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex justify-between px-4 py-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}
