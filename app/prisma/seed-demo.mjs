// Fictional demo properties so the guest pages have something to show.
//   npm run seed:demo            -> (re)creates the demo properties
//   npm run seed:demo -- --remove -> deletes them
// Everything it creates has a slug starting with "demo-"; real properties are never touched.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`

const PROPERTIES = [
  {
    name: 'Azure Bay Beach Club', city: 'Hurghada', area: 'Sahl Hasheesh', type: 'beach_club', stars: 5,
    amenities: ['Private Beach', 'Pool', 'Restaurant', 'WiFi', 'Parking'],
    images: ['1507525428034-b723cf961d3e', '1544551763-46a013bb70d5', '1519046904884-53103b34b206'],
    packages: [
      { name: 'Beach Day', adultPrice: 1400, childPrice: 700, inclusions: ['Sunbed & umbrella', 'Towel', 'Welcome drink'] },
      { name: 'Beach & Lunch', adultPrice: 2100, childPrice: 1000, inclusions: ['Sunbed & umbrella', 'Towel', 'Set lunch', 'Soft drinks'] },
    ],
  },
  {
    name: 'Palm Lagoon Resort', city: 'Hurghada', area: 'El Gouna', type: 'resort', stars: 5,
    amenities: ['Pool', 'Private Beach', 'Spa', 'Kids Area', 'Restaurant', 'WiFi'],
    images: ['1540541338287-41700207dee6', '1520250497591-112f2f40a3f4', '1582719508461-905c673771fd'],
    packages: [{ name: 'Lagoon Day Pass', adultPrice: 1800, childPrice: 900, inclusions: ['Pool & beach access', 'Towel', 'Lunch buffet'] }],
  },
  {
    name: 'Coral Garden Hotel & Spa', city: 'Sharm el Sheikh', area: 'Naama Bay', type: 'hotel', stars: 4,
    amenities: ['Pool', 'Spa', 'Gym', 'WiFi', 'Restaurant'],
    images: ['1571896349842-33c89424de2d', '1584132967334-10e028bd69f7'],
    packages: [
      { name: 'Pool Day', adultPrice: 950, childPrice: 450, inclusions: ['Pool access', 'Towel'] },
      { name: 'Spa Escape', adultPrice: 2600, childPrice: 0, inclusions: ['Pool access', '60-min massage', 'Steam room'] },
    ],
  },
  {
    name: 'Sunset Cove Beach Club', city: 'Sharm el Sheikh', area: 'Sharks Bay', type: 'beach_club', stars: null,
    amenities: ['Private Beach', 'Restaurant', 'WiFi'],
    images: ['1573843981267-be1999ff37cd', '1544551763-46a013bb70d5'],
    packages: [{ name: 'Sunset Session', adultPrice: 800, childPrice: 400, inclusions: ['Sunbed', 'Snorkel gear', 'Sunset mocktail'] }],
  },
  {
    name: 'Nile Terrace Hotel', city: 'Cairo', area: 'Zamalek', type: 'hotel', stars: 5,
    amenities: ['Pool', 'Gym', 'Spa', 'WiFi', 'Restaurant', 'Parking'],
    images: ['1551882547-ff40c63fe5fa', '1566073771259-6a8506099945', '1445019980597-93fa8acb246c'],
    packages: [{ name: 'Rooftop Pool Day', adultPrice: 1600, childPrice: 800, inclusions: ['Rooftop pool', 'Towel', 'Light lunch'] }],
  },
  {
    name: 'Oasis Garden Resort', city: 'Cairo', area: 'New Cairo', type: 'resort', stars: 4,
    amenities: ['Pool', 'Kids Area', 'Restaurant', 'Parking', 'WiFi'],
    images: ['1561501900-3701fa6a0864', '1590523277543-a94d2e4eb00b'],
    packages: [{ name: 'Family Pool Day', adultPrice: 700, childPrice: 350, inclusions: ['Pool access', 'Kids club', 'Towel'] }],
  },
  {
    name: 'Sokhna Sands Resort', city: 'Ain Sokhna', area: null, type: 'resort', stars: 4,
    amenities: ['Private Beach', 'Pool', 'Kids Area', 'Restaurant', 'Parking'],
    images: ['1615571022219-eb45cf7faa9d', '1578683010236-d716f9a3f461'],
    packages: [{ name: 'Day Escape', adultPrice: 1100, childPrice: 550, inclusions: ['Beach & pool access', 'Lunch buffet', 'Soft drinks'] }],
  },
  {
    name: 'Mediterranean Pearl Hotel', city: 'Alexandria', area: 'Stanley', type: 'hotel', stars: 3,
    amenities: ['Pool', 'Restaurant', 'WiFi'],
    images: ['1582719508461-905c673771fd', '1571896349842-33c89424de2d'],
    packages: [{ name: 'Sea-view Pool Day', adultPrice: 600, childPrice: 300, inclusions: ['Pool access', 'Towel'] }],
  },
]

const slug = (name) => 'demo-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function removeDemo() {
  const props = await prisma.property.findMany({ where: { slug: { startsWith: 'demo-' } }, select: { id: true } })
  const ids = props.map((p) => p.id)
  if (!ids.length) return 0
  if (await prisma.booking.count({ where: { propertyId: { in: ids } } })) {
    throw new Error('Demo properties have bookings; deactivate them in the admin instead of deleting.')
  }
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { propertyId: { in: ids } } }),
    prisma.packageAddOn.deleteMany({ where: { package: { propertyId: { in: ids } } } }),
    prisma.propertyPricing.deleteMany({ where: { propertyId: { in: ids } } }),
    prisma.availabilityWindow.deleteMany({ where: { propertyId: { in: ids } } }),
    prisma.blackoutDate.deleteMany({ where: { propertyId: { in: ids } } }),
    prisma.package.deleteMany({ where: { propertyId: { in: ids } } }),
    prisma.property.deleteMany({ where: { id: { in: ids } } }),
  ])
  return ids.length
}

try {
  const removed = await removeDemo()
  if (process.argv.includes('--remove')) {
    console.log(`Removed ${removed} demo properties.`)
  } else {
    for (const [i, p] of PROPERTIES.entries()) {
      const images = p.images.map(img)
      await prisma.property.create({
        data: {
          name: p.name,
          slug: slug(p.name),
          city: p.city,
          area: p.area,
          type: p.type,
          stars: p.stars,
          address: `${p.area ? p.area + ', ' : ''}${p.city}, Egypt`,
          description: `${p.name} is a fictional demo listing used to preview DayUse. Spend the day by the water with everything you need for a relaxed escape — no overnight stay required.`,
          amenities: p.amenities,
          coverImage: images[0],
          images,
          // Stagger creation times so "newest" ordering is stable.
          createdAt: new Date(Date.now() - i * 60_000),
          packages: {
            create: p.packages.map((pkg, sortOrder) => ({
              ...pkg,
              description: `${pkg.name} at ${p.name}.`,
              sortOrder,
              addOns: { create: [{ name: 'Lunch upgrade', price: 350 }, { name: 'Cabana', price: 900, perPerson: false }] },
            })),
          },
          availabilityWindows: { create: { startTime: '09:00', endTime: '18:00', maxCapacityAdults: 80, maxCapacityChildren: 30 } },
        },
      })
    }
    console.log(`Created ${PROPERTIES.length} demo properties${removed ? ` (replaced ${removed})` : ''}.`)
  }
} finally {
  await prisma.$disconnect()
}
