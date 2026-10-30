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

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.instagram.com https://platform.twitter.com https://www.tiktok.com https://connect.facebook.net https://www.threads.net https://www.youtube.com https://news.google.com https://*.adtrafficquality.google https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://news.google.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://pagead2.googlesyndication.com https://cms.beritana.com https://*.cloudinary.com https://cdn.beritana.com https://*.adtrafficquality.google https://news.google.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
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

/* ─── Edge HTML cache (Cloudflare Cache API) ────────────────────────────────
 * The site runs on the Workers FREE tier (10ms CPU/request). An uncached HTML
 * render (sanitize-html + React SSR of the page island) can exceed that budget
 * → "Worker exceeded CPU time limit" (503 / Error 1102).
 *
 * The s-maxage headers alone are not enough: Workers output is NOT stored in
 * Cloudflare's traditional CDN cache, so without this the Worker re-renders on
 * essentially every request. Here we use the Workers Cache API (caches.default)
 * explicitly: a cache HIT returns the stored HTML without running any render
 * code (~0ms CPU), and a MISS renders once then stores the result for the
 * route's TTL. This is the key fix that keeps the free tier under budget.
 *
 * Guarded so it's a safe no-op in dev/Node where caches.default is absent.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Seconds the EDGE should keep a rendered HTML page (how long until the Worker
 *  renders it again). Mirrors the s-maxage tiers in htmlCacheControl. Returns 0
 *  for paths we must never edge-cache (private/error). */
function edgeCacheTtl(pathname: string, status: number): number {
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

/** The Workers Cache API default cache, or null outside the Workers runtime. */
function edgeCache(): Cache | null {
  try {
    // @ts-expect-error caches.default is a Workers runtime global, not in lib.dom
    const c = typeof caches !== 'undefined' ? caches.default : null
    return (c as Cache) || null
  } catch {
    return null
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  const method = context.request.method

  // Edge-cache lookup — only for idempotent GET of cacheable HTML paths.
  const cache = edgeCache()
  const cacheable = method === 'GET' && edgeCacheTtl(pathname, 200) > 0
  // Key the cache on the full URL via the request itself.
  const cacheKey = context.request

  if (cache && cacheable) {
    const cached = await cache.match(cacheKey)
    if (cached) {
      // HIT — return stored HTML without rendering (≈0ms CPU on the Worker).
      return cached
    }
  }

  const response = await next()

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
  const isHtml = contentType.includes('text/html')
  if (isHtml && !response.headers.has('Cache-Control')) {
    const cc = htmlCacheControl(pathname, response.status)
    if (cc) response.headers.set('Cache-Control', cc)
  }

  // Store a successful HTML render in the edge cache so the next request skips
  // the Worker render entirely. Done via waitUntil so it never delays this
  // response. We store a COPY whose Cache-Control carries s-maxage=<ttl>, which
  // caches.default honours as its retention.
  const ttl = edgeCacheTtl(pathname, response.status)
  if (cache && cacheable && isHtml && response.status === 200 && ttl > 0) {
    const toStore = response.clone()
    const storeHeaders = new Headers(toStore.headers)
    storeHeaders.set(
      'Cache-Control',
      `public, s-maxage=${ttl}, stale-while-revalidate=86400`
    )
    const storeResponse = new Response(toStore.body, {
      status: toStore.status,
      statusText: toStore.statusText,
      headers: storeHeaders,
    })
    // Astro v6 (@astrojs/cloudflare): the execution context is exposed as
    // locals.cfContext (the old locals.runtime.ctx throws if accessed). Use
    // waitUntil so the cache write never delays the response; fall back to a
    // fire-and-forget promise outside the Workers runtime (dev/Node).
    const cfContext = (context.locals as { cfContext?: { waitUntil?: (p: Promise<unknown>) => void } })
      ?.cfContext
    const put = cache.put(cacheKey, storeResponse)
    if (cfContext?.waitUntil) cfContext.waitUntil(put)
    else void put
  }

  return response
})
