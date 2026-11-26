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

import { LISTING_TTL, ARTICLE_TTL } from '@/lib/env'

// HTTPS-only enforcement (HSTS + CSP's upgrade-insecure-requests) is CORRECT in
// production (served over https://beritana.com) but BREAKS plain-HTTP testing
// via an IP:port — the browser force-upgrades every asset to https, which the
// Node server doesn't speak, so CSS/JS fail with ERR_SSL_PROTOCOL_ERROR. Set
// DISABLE_HTTPS_UPGRADE=true (in .env) only while testing over http://<ip> to
// drop both; leave it UNSET in production so HSTS stays on.
const DISABLE_HTTPS_UPGRADE =
  (process.env.DISABLE_HTTPS_UPGRADE || '').toLowerCase() === 'true'

// Origin of the CDN serving /_astro/* (build.assetsPrefix), e.g.
// https://assets.beritana.com. Inlined at build time by astro.config.mjs so it
// always matches the URLs baked into the HTML. Empty when assets are served by
// the site itself. Without it in the CSP the browser blocks all CSS/JS.
const ASSETS_ORIGIN = (() => {
  try {
    return process.env.ASSETS_PREFIX ? new URL(process.env.ASSETS_PREFIX).origin : ''
  } catch {
    return ''
  }
})()
const A = ASSETS_ORIGIN ? ` ${ASSETS_ORIGIN}` : ''

const CSP = [
  "default-src 'self'",
  `script-src 'self'${A} 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.instagram.com https://platform.twitter.com https://www.tiktok.com https://connect.facebook.net https://www.threads.net https://www.youtube.com https://news.google.com https://*.adtrafficquality.google https://static.cloudflareinsights.com`,
  `style-src 'self'${A} 'unsafe-inline' https://fonts.googleapis.com https://news.google.com`,
  "img-src 'self' data: blob: https: http:",
  `font-src 'self'${A} https://fonts.gstatic.com`,
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://pagead2.googlesyndication.com https://cms.beritana.com https://*.cloudinary.com https://cdn.beritana.com https://*.adtrafficquality.google https://news.google.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
  "frame-src 'self' https://www.youtube.com https://www.instagram.com https://platform.twitter.com https://www.tiktok.com https://www.facebook.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://news.google.com https://*.adtrafficquality.google https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // Only force-upgrade assets to https when NOT in http-test mode.
  ...(DISABLE_HTTPS_UPGRADE ? [] : ['upgrade-insecure-requests']),
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // HSTS omitted in http-test mode (it's what pins the browser to https for the
  // bare IP and causes ERR_SSL_PROTOCOL_ERROR on subsequent visits).
  ...(DISABLE_HTTPS_UPGRADE
    ? {}
    : { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' }),
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
    return `public, max-age=0, s-maxage=${ARTICLE_TTL}, stale-while-revalidate=86400`
  }

  // CMS pages + author profiles — change infrequently.
  if (pathname.startsWith('/pages/') || pathname.startsWith('/profile/')) {
    return 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600'
  }

  // Listing pages that must surface new articles reasonably fast: homepage,
  // categories, tag, foto, video, stories, infografis, ekoran, leaderboard.
  // TTL is env-tunable (LISTING_TTL, default 30s): a new article shows within
  // ~that window; SWR keeps responses instant and cheap in between.
  return `public, max-age=0, s-maxage=${LISTING_TTL}, stale-while-revalidate=600`
}

/* ─── In-process HTML cache (Node / VPS) ────────────────────────────────────
 * On a long-lived Node process (unlike Cloudflare Workers' short-lived
 * isolates) an in-memory cache persists across requests and is extremely
 * effective: the heavy work (sanitize-html + React SSR of the page island)
 * runs ONCE per URL per TTL window, and every other request is served from
 * memory in well under a millisecond. This is what keeps a 1GB VPS responsive
 * under crawler + reader load, and replaces the Cloudflare Cache API we used
 * on Workers.
 *
 * Freshness is unchanged: an entry lives for the route's TTL (LISTING_TTL=30s
 * for listings, ARTICLE_TTL for article detail), then the next request triggers
 * a background re-render (stale-while-revalidate) so visitors never wait.
 *
 * A reverse proxy (Nginx/Cloudflare) in front still layers its own HTTP cache
 * via the Cache-Control headers below, so most requests never even reach Node.
 * ──────────────────────────────────────────────────────────────────────────── */

interface HtmlCacheEntry {
  body: string
  headers: [string, string][]
  status: number
  expires: number // epoch ms
  refreshing?: boolean
}

const htmlCache = new Map<string, HtmlCacheEntry>()
// Cap entries so a crawler hitting every URL can't grow memory without bound —
// critical on a 1GB VPS. Oldest (insertion-ordered) entries are evicted first.
const HTML_CACHE_MAX = 400

/** Seconds a rendered HTML page stays cached (time until re-render). Mirrors
 *  the s-maxage tiers in htmlCacheControl. 0 = never cache (private/error). */
function htmlCacheTtl(pathname: string, status: number): number {
  if (status >= 400) return 0
  if (PRIVATE_PATHS.has(pathname)) return 0
  if (pathname.startsWith('/pages/') || pathname.startsWith('/profile/')) return 600
  const NON_ARTICLE_2SEG = /^\/(video|foto|tag|profile|stories|live|amp|api|news-sitemap|kategori)\//
  if (
    pathname.startsWith('/berita/') ||
    (/^\/[^/]+\/[^/]+$/.test(pathname) && !NON_ARTICLE_2SEG.test(pathname))
  ) {
    return ARTICLE_TTL
  }
  return LISTING_TTL
}

function buildResponseFromEntry(entry: HtmlCacheEntry): Response {
  return new Response(entry.body, {
    status: entry.status,
    headers: new Headers(entry.headers),
  })
}

/** Render the route fully, apply site headers, and (for cacheable HTML 200s)
 *  store the result in the in-process cache. Returns the live Response. */
async function renderAndMaybeCache(
  context: Parameters<Parameters<typeof defineMiddleware>[0]>[0],
  next: Parameters<Parameters<typeof defineMiddleware>[0]>[1],
  cacheKey: string | null
): Promise<Response> {
  const { pathname } = context.url
  const response = await next()

  // Security headers on every response.
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) response.headers.set(key, value)
  }

  // AI content declaration files — explicit type + long cache.
  if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
    response.headers.set('Content-Type', 'text/plain; charset=utf-8')
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return response
  }

  // Only add HTML caching when the route didn't set its own Cache-Control.
  const contentType = response.headers.get('Content-Type') || ''
  const isHtml = contentType.includes('text/html')
  if (isHtml && !response.headers.has('Cache-Control')) {
    const cc = htmlCacheControl(pathname, response.status)
    if (cc) response.headers.set('Cache-Control', cc)
  }

  // Store a successful HTML render in the in-process cache.
  const ttl = htmlCacheTtl(pathname, response.status)
  if (cacheKey && isHtml && response.status === 200 && ttl > 0) {
    // Read the body as text so we can re-serve it many times. We return a fresh
    // Response built from that text (the original stream is consumed here).
    const body = await response.text()
    const headers = [...response.headers.entries()]
    if (htmlCache.size >= HTML_CACHE_MAX) {
      const oldest = htmlCache.keys().next().value
      if (oldest !== undefined) htmlCache.delete(oldest)
    }
    htmlCache.set(cacheKey, {
      body,
      headers,
      status: response.status,
      expires: Date.now() + ttl * 1000,
    })
    return new Response(body, { status: response.status, headers: new Headers(headers) })
  }

  return response
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  const method = context.request.method

  // Only idempotent GETs of cacheable HTML paths use the in-process cache.
  const cacheable = method === 'GET' && htmlCacheTtl(pathname, 200) > 0
  const cacheKey = cacheable ? context.url.pathname + context.url.search : null

  if (cacheKey) {
    const hit = htmlCache.get(cacheKey)
    // Fresh hit — serve instantly from memory (no render).
    if (hit && hit.expires > Date.now()) {
      return buildResponseFromEntry(hit)
    }
    // Stale/cold: fall through to render. `next()` is bound to this request and
    // can only run once, so we render synchronously here (one render per URL per
    // TTL window) and refresh the cache. The HTTP Cache-Control headers still
    // let the reverse proxy (Nginx/Cloudflare) absorb the bulk of traffic with
    // its own stale-while-revalidate, so Node renders are infrequent.
  }

  // Cold miss, stale, or non-cacheable — render now (and cache if eligible).
  return renderAndMaybeCache(context, next, cacheKey)
})
