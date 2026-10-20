'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Grid2x2, X } from 'lucide-react'
import { PropertyImage } from '@/components/property/PropertyImage'
import { cn } from '@/lib/utils'


export function PropertyGallery({ images, name }: { images: string[]; name: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 })
  const [selected, setSelected] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox])

  return (
    <section aria-label="Photos" className="bg-navy">
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((src, i) => (
              <div key={src + i} className="relative h-[45vh] min-w-0 flex-[0_0_100%] sm:h-[60vh]">
                <PropertyImage src={src} alt={`${name} — photo ${i + 1}`} sizes="100vw" priority={i === 0} />
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy shadow hover:bg-white sm:block"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy shadow hover:bg-white sm:block"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Dots on mobile, thumbnails on larger screens */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  className={cn('h-2 rounded-full transition-all', i === selected ? 'w-5 bg-white' : 'w-2 bg-white/60')}
                  aria-label={`Show photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-navy shadow hover:bg-grey-50"
        >
          <Grid2x2 className="h-4 w-4" />
          View all photos
        </button>
      </div>

      {images.length > 1 && (
        <div className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none] sm:flex">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => scrollTo(i)}
              className={cn('relative h-16 w-24 shrink-0 overflow-hidden rounded-md ring-2 transition', i === selected ? 'ring-coral' : 'opacity-60 ring-transparent hover:opacity-100')}
              aria-label={`Show photo ${i + 1}`}
            >
              <PropertyImage src={src} alt="" sizes="96px" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/95 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`All photos of ${name}`}>
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between text-white">
              <p className="font-playfair text-xl">{name}</p>
              <button type="button" onClick={() => setLightbox(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close photos">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => {
                    scrollTo(i)
                    setLightbox(false)
                  }}
                  className={cn('relative aspect-[4/3] overflow-hidden rounded-lg', i === 0 && 'sm:col-span-2')}
                >
                  <PropertyImage src={src} alt={`${name} — photo ${i + 1}`} sizes="(min-width: 640px) 50vw, 100vw" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
