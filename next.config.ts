import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // the contact page used to live at /contacts
  async redirects() {
    return [{ source: '/contacts', destination: '/contact', permanent: true }]
  },
  async headers() {
    // rendered media never changes under the same name: let browsers and CDNs keep it
    return [{ source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] }]
  },
}

export default config
