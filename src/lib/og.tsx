import { ImageResponse } from '@/compat/next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * Replaces Next's `revalidate = 3600` on the opengraph-image routes. Without a
 * cache header every social scraper / crawler hit re-runs Satori + resvg, which
 * is real CPU cost on a news site.
 *
 * We must REPLACE the Cache-Control that @vercel/og sets by default
 * (`immutable, max-age=31536000`): appending would emit two comma-joined values
 * (malformed), and a 1-year immutable cache is wrong here because the image is
 * derived from a title/category that can change.
 */
const OG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'

function withOgCache(res: ImageResponse): Response {
  const headers = new Headers(res.headers)
  headers.set('Cache-Control', OG_CACHE_CONTROL)
  return new Response(res.body, { status: res.status, headers })
}

// Brand default color
export const BRAND_COLOR = '#E53935'

/** Readable text color (white/dark) based on background luminance */
export function getTextColor(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length < 6) return '#ffffff'
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff'
}

/** Darken a hex color by a percentage (for gradient end) */
export function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  if (c.length < 6) return hex
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)))
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)))
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)))
  return `rgb(${r}, ${g}, ${b})`
}

interface BrandOgOptions {
  /** Main title shown large in the center */
  title: string
  /** Small label above the title (e.g. "Kanal", "Tag", "Halaman") */
  label?: string
  /** Background base color (defaults to brand red) */
  color?: string
  /** Site name shown at the bottom */
  siteName?: string
}

/**
 * Generate a branded OG image: colored gradient background + centered title.
 * Used by all public pages that don't have their own feature image.
 */
export function brandOgImage(options: BrandOgOptions): Response {
  const color = options.color || BRAND_COLOR
  const siteName = options.siteName || process.env.NEXT_PUBLIC_SITE_NAME || 'Beritana'
  const textColor = getTextColor(color)
  const bgEnd = darken(color, 0.35)

  // Scale font size down for very long titles
  const len = options.title.length
  const titleSize = len > 28 ? 72 : len > 18 ? 90 : 110

  return withOgCache(new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${color} 0%, ${bgEnd} 100%)`,
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 12,
            background: textColor === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
          }}
        />

        {/* Label */}
        {options.label && (
          <div
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: textColor,
              opacity: 0.85,
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {options.label}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 800,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.1,
            padding: '0 80px',
            maxWidth: 1080,
          }}
        >
          {options.title}
        </div>

        {/* Site name footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 36,
            fontWeight: 700,
            color: textColor,
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {siteName}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  ))
}

interface ProfileOgOptions {
  name: string
  role?: string
  avatarUrl?: string
  siteName?: string
}

/**
 * Author profile OG image — avatar (or initial) + name + role on brand gradient.
 * Extracted verbatim from the old profile/[slug]/opengraph-image layout.
 */
export function profileOgImage(options: ProfileOgOptions): Response {
  const name = options.name
  const role = options.role || ''
  const avatarUrl = options.avatarUrl || ''
  const siteName = options.siteName || process.env.NEXT_PUBLIC_SITE_NAME || 'Beritana'
  const bgEnd = darken(BRAND_COLOR, 0.35)

  return withOgCache(new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, ${bgEnd} 100%)`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 12,
            background: 'rgba(255,255,255,0.25)',
          }}
        />

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            width={240}
            height={240}
            style={{
              width: 240,
              height: 240,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '10px solid rgba(255,255,255,0.9)',
            }}
          />
        ) : (
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 120,
              fontWeight: 800,
              color: BRAND_COLOR,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          style={{
            marginTop: 36,
            fontSize: name.length > 22 ? 56 : 72,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            padding: '0 80px',
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>

        {role && (
          <div
            style={{
              marginTop: 12,
              fontSize: 32,
              fontWeight: 500,
              color: '#ffffff',
              opacity: 0.9,
              textTransform: 'capitalize',
            }}
          >
            {role}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 30,
            fontWeight: 700,
            color: '#ffffff',
            opacity: 0.85,
            display: 'flex',
          }}
        >
          Penulis {siteName}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  ))
}
