/**
 * Web app manifest — equivalent of Next's src/app/manifest.ts.
 * Served at /manifest.webmanifest.
 */
import type { APIRoute } from 'astro'
import { getSiteConfig } from '@/lib/site-config'

export const prerender = false

export const GET: APIRoute = async () => {
  const config = await getSiteConfig()

  const manifest = {
    name: config.site_title,
    short_name: config.site_name,
    description: config.site_description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E53935',
    icons: [
      { src: '/images/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/images/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/images/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/images/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
