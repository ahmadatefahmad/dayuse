// Public site settings shared by metadata, sitemap and emails.
export const SITE_NAME = 'DayUse Egypt'
export const SITE_DESCRIPTION = 'Book day passes to Egypt’s best hotels, beach clubs and resorts. Pool, beach and spa access by the day — pay a small fee online, the rest on arrival.'
export const siteUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
