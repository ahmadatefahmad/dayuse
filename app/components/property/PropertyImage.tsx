import Image from 'next/image'
import { cn } from '@/lib/utils'

// Must match images.remotePatterns in next.config.mjs.
const OPTIMIZED_HOSTS = new Set(['res.cloudinary.com', 'images.unsplash.com'])

function isOptimizable(src: string) {
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname)
  } catch {
    return false
  }
}

type Props = {
  src: string
  alt: string
  sizes: string // e.g. "(min-width: 1024px) 33vw, 100vw" — what width the image renders at
  priority?: boolean // above-the-fold images: load eagerly, no lazy-loading
  className?: string
}

// Fills its parent (which must be position: relative/absolute). Cloudinary/Unsplash images are
// resized and served as AVIF/WebP via next/image; other hosts (pasted URLs) fall back to <img>.
export function PropertyImage({ src, alt, sizes, priority, className }: Props) {
  if (isOptimizable(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn('object-cover', className)} />
  }
  // eslint-disable-next-line @next/next/no-img-element -- host isn't in the optimiser allowlist
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={cn('absolute inset-0 h-full w-full object-cover', className)} />
}
