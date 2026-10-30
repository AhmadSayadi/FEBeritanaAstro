/*
 * OG image strategy on the 1GB VPS: DYNAMIC generation DISABLED.
 *
 * Previously these used @vercel/og (Satori + a ~1.4MB resvg WASM) to rasterize
 * a 1200x630 PNG per request. That is very CPU- and memory-hungry — fine on
 * big serverless, but on a 1GB Node VPS it risks OOM and slow renders. Since
 * only a handful of brand/listing pages used it (articles already use their own
 * thumbnail as the OG image), these routes now redirect to a single static
 * branded image. Social scrapers still get a valid 1200x630 image, and the
 * heavy WASM is dropped from the server bundle entirely.
 *
 * All exported names/signatures are unchanged so the opengraph-image.png.ts
 * routes keep working. To re-enable dynamic OG later (bigger box), restore the
 * @/compat/og ImageResponse implementation from git history.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

// Brand default color (kept exported — some routes import it).
export const BRAND_COLOR = '#E53935'

const SITE_URL_OG = (process.env.PUBLIC_SITE_URL || 'https://beritana.com').replace(/\/$/, '')
/** Single static branded OG image shipped in /public. Absolute URL so social
 *  scrapers (which don't resolve relative paths) can always fetch it. */
const STATIC_OG_IMAGE = `${SITE_URL_OG}/images/thumbnail_home.png`

/** 302 redirect to the static OG image. Near-zero CPU/RAM; replaces the old
 *  Satori+resvg rasterization. Cached long since the target never changes. */
function staticOgRedirect(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: STATIC_OG_IMAGE,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

/** Readable text color (white/dark) based on background luminance.
 *  Kept for API compatibility with callers that import it. */
export function getTextColor(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length < 6) return '#ffffff'
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff'
}

/** Darken a hex color by a percentage. Kept for API compatibility. */
export function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  if (c.length < 6) return hex
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)))
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)))
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}

interface BrandOgOptions {
  title: string
  label?: string
  color?: string
  siteName?: string
}

/**
 * Brand OG image for listing/brand pages. Now returns a redirect to the static
 * branded image instead of rendering with Satori+resvg (VPS memory safety).
 */
export function brandOgImage(_options: BrandOgOptions): Response {
  return staticOgRedirect()
}

interface ProfileOgOptions {
  name: string
  role?: string
  avatarUrl?: string
  siteName?: string
}

/**
 * Author profile OG image. Now returns a redirect to the static branded image
 * (dynamic Satori+resvg rendering disabled on the VPS).
 */
export function profileOgImage(_options: ProfileOgOptions): Response {
  return staticOgRedirect()
}
