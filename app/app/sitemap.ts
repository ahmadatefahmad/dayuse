import type { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { siteUrl } from '@/lib/site'
import { CITIES, citySlug } from '@/lib/validations/property'

// Regenerated at most hourly.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const properties = await prisma.property.findMany({
    where: { active: true, packages: { some: { active: true } } },
    select: { id: true, updatedAt: true },
  })
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    ...CITIES.map((c) => ({ url: `${base}/search?city=${citySlug(c)}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 })),
    ...properties.map((p) => ({ url: `${base}/property/${p.id}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.9 })),
  ]
}
