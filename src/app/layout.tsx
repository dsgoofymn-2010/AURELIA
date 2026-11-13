import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
// fonts ship with the site: no third-party request before the first paint
import '@fontsource/cormorant-garamond/latin-300.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource-variable/manrope/wght.css'
import { TierFlag } from '@/components/layout/TierFlag'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'AURELIA Residences', template: '%s · AURELIA' },
  description: 'AURELIA — ten full-floor residences. Explore the tower, step inside a residence and walk its rooms.',
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0a10',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // the tier flag and the home page's scroll lock are set on <html> by script
    <html lang="en" suppressHydrationWarning>
      <body>
        <TierFlag />
        {children}
      </body>
    </html>
  )
}
