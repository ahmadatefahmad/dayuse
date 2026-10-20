// Shared, client-safe formatting for bookings (pages, emails, WhatsApp).

// Short human reference shown to guests and hotels, e.g. "DU-4F7A2C9B".
export const bookingReference = (id: string) => `DU-${id.slice(-8).toUpperCase()}`

// "Corniche Rd, El Gouna, Hurghada" — skips area/city when the address already includes them.
export const formatLocation = (address: string, area: string | null, city: string) =>
  [address, ...[area, city].filter((part): part is string => Boolean(part) && !address.toLowerCase().includes(part!.toLowerCase()))].join(', ')

export const guestSummary = (b: { adults: number; children: number; infants: number }) =>
  [
    `${b.adults} adult${b.adults === 1 ? '' : 's'}`,
    b.children ? `${b.children} child${b.children === 1 ? '' : 'ren'}` : null,
    b.infants ? `${b.infants} infant${b.infants === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(', ')
