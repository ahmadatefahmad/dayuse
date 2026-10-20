import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from '@/lib/site'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const inter    = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Defaults for every page; pages override title/description (and images for properties).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${SITE_NAME} — Day passes to hotels, beach clubs & resorts`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_EG',
    title: `${SITE_NAME} — Your perfect day escape`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
