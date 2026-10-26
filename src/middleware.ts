import { defineMiddleware } from 'astro:middleware'

/**
 * Middleware — site-wide response headers.
 *
 * Replaces Next's `next.config.mjs` → `async headers()`, which Astro has no
 * config equivalent for. Covers:
 *   - the 7 security headers + full Content-Security-Policy
 *   - the `Link` ai-content-declaration header (llms.txt / llms-full.txt)
 *   - per-path Cache-Control, which is also our replacement for Next's ISR
 *     (`export const revalidate`): instead of a build cache we let the CDN /
 *     reverse proxy cache the SSR HTML via s-maxage + stale-while-revalidate.
 *
 * Note on routing: the clean-URL structure (`/{category}/{slug}` for articles,
 * `/{slug}` for categories) is handled by Astro's file-based routing, not by
 * rewrites here — static routes win over the catch-alls by route priority.
 */

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.instagram.com https://platform.twitter.com https://www.tiktok.com https://connect.facebook.net https://www.threads.net https://www.youtube.com https://news.google.com https://*.adtrafficquality.google",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://news.google.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://pagead2.googlesyndication.com https://cms.beritana.com https://*.cloudinary.com https://cdn.beritana.com https://*.adtrafficquality.google https://wttr.in https://news.google.com",
  "frame-src 'self' https://www.youtube.com https://www.instagram.com https://platform.twitter.com https://www.tiktok.com https://www.facebook.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://news.google.com https://*.adtrafficquality.google https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  Link: '</llms.txt>; rel="ai-content-declaration", </llms-full.txt>; rel="ai-content-declaration-full"',
  'Content-Security-Policy': CSP,
}

/** Pages that must never be cached or indexed (auth / user-specific). */
const PRIVATE_PATHS = new Set([
  '/masuk',
  '/daftar',
  '/lupa-password',
  '/tulis',
  '/profil',
  '/traktir',
  '/pencarian',
])

/**
 * HTML Cache-Control per route shape — mirrors the old `revalidate` values.
 * s-maxage lets the CDN serve cached HTML; stale-while-revalidate keeps it
 * fast while a fresh copy is fetched in the background.
 */
function htmlCacheControl(pathname: string, status: number): string | null {
  // Never cache error responses — a cached 404/500 would poison the CDN.
  if (status >= 400) return 'private, no-store'
  if (PRIVATE_PATHS.has(pathname)) return 'private, no-store'

  // ── Free-tier ("kere hore") strategy ──────────────────────────────────────
  // `s-maxage` = how long the CDN serves a page WITHOUT invoking the Worker.
  // Longer → far fewer Worker invocations (the metered free-tier resource).
  // `stale-while-revalidate` = after s-maxage the CDN keeps serving the cached
  // copy INSTANTLY while one background request refreshes it, so visitors never
  // wait on the slow backend and freshness still catches up on its own.
  // No client polling is used, so these headers are the only freshness knob.

  // rss-feeds listing — changes rarely.
  if (pathname === '/rss-feeds') return 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'

  // Article detail (/{category}/{slug}, /berita/*): content is essentially
  // immutable once published, so cache long and refresh lazily. Big Worker
  // saving since articles are the bulk of traffic. We match a two-segment path
  // but exclude the non-article two-segment sections (/video/*, /tag/*, etc.),
  // which fall through to the shorter listing TTL below.
  const NON_ARTICLE_2SEG = /^\/(video|foto|tag|profile|stories|live|amp|api|news-sitemap|kategori)\//
  if (
    pathname.startsWith('/berita/') ||
    (/^\/[^/]+\/[^/]+$/.test(pathname) && !NON_ARTICLE_2SEG.test(pathname))
  ) {
    return 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
  }

  // CMS pages + author profiles — change infrequently.
  if (pathname.startsWith('/pages/') || pathname.startsWith('/profile/')) {
    return 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600'
  }

  // Listing pages that must surface new articles reasonably fast: homepage,
  // categories, tag, foto, video, stories, infografis, ekoran, leaderboard.
  // 120s fresh means a new article shows within ~2 min; SWR keeps it instant
  // and cheap in between.
  return 'public, max-age=0, s-maxage=120, stale-while-revalidate=600'
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  const { pathname } = context.url

  // Security headers on every response.
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) response.headers.set(key, value)
  }

  // AI content declaration files — explicit type + long cache (was in next.config).
  if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
    response.headers.set('Content-Type', 'text/plain; charset=utf-8')
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return response
  }

  // Only add HTML caching when the route didn't already set its own
  // Cache-Control (XML/RSS/API endpoints manage their own TTLs).
  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('text/html') && !response.headers.has('Cache-Control')) {
    const cc = htmlCacheControl(pathname, response.status)
    if (cc) response.headers.set('Cache-Control', cc)
  }

  return response
})
