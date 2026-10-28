/**
 * API Fetch Helper — connects to Laravel backend
 * All requests require X-API-Key header
 * Authenticated requests also need Authorization: Bearer {token}
 */

import { env, CDN_RESIZE_ENABLED, IMG_RESIZE_PROVIDER } from './env'

// Read per-call, NOT frozen at module load. On Cloudflare Workers the runtime
// env (process.env, populated from dashboard vars) may not be ready at module
// init, so capturing these as top-level consts could freeze them to '' and send
// every backend request without the API key. Functions read the current value.
const API_BASE = () => env('API_BASE_URL', 'https://cms.beritana.com/api')
const API_KEY = () => env('API_SECRET_KEY', '')

/**
 * Public API fetch (no auth token needed, only API key)
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE()}${path}`

  const res = await fetch(url, {
    // Default 8s timeout so a stalled CMS can't hang SSR / an API proxy route
    // forever. Caller can override by passing its own `signal`.
    signal: AbortSignal.timeout(8000),
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY(),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`API Error ${res.status}: ${res.statusText} — ${errorBody}`)
  }

  // 204 No Content (e.g. track view)
  if (res.status === 204) {
    return {} as T
  }

  return res.json()
}

/**
 * Authenticated API fetch (requires user Bearer token + API key)
 */
export async function apiAuthFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
}

/* ─── SSR response cache (ISR replacement) ─────────────────────────────────
 * In Next.js, `fetch(url, { next: { revalidate } })` cached the response for
 * `revalidate` seconds. That option is a Next-only extension and is SILENTLY
 * IGNORED by Node's fetch, so after the Astro migration every page re-hit the
 * backend on every request (the /articles/{slug}/full call alone is ~1.4s).
 *
 * This lightweight in-process cache restores that behaviour: a GET result is
 * cached for `revalidateSeconds`, keyed by URL. Served stale-while-revalidate:
 * once expired, the first caller refreshes in the background and still gets the
 * old value instantly (no request pays the full backend latency). The cache is
 * per server instance (same model as Next's ISR per-instance memory cache); the
 * CDN s-maxage headers from middleware.ts still layer on top for edge caching.
 * ────────────────────────────────────────────────────────────────────────── */

interface CacheEntry {
  value: unknown
  expires: number // epoch ms after which the entry is stale
  refreshing?: boolean
}

const ssrCache = new Map<string, CacheEntry>()
// Bound the map so a crawler hitting thousands of URLs can't grow memory
// unbounded. When over the cap, drop the oldest (insertion-ordered) entries.
const SSR_CACHE_MAX = 500

function cacheGet(key: string): CacheEntry | undefined {
  return ssrCache.get(key)
}

function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  if (ssrCache.size >= SSR_CACHE_MAX) {
    const oldest = ssrCache.keys().next().value
    if (oldest !== undefined) ssrCache.delete(oldest)
  }
  ssrCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY(),
    },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

/**
 * API fetch with per-instance revalidation cache (ISR replacement).
 * `revalidateSeconds` controls how long a response is served from memory before
 * a background refresh. Pass 0 to bypass the cache.
 */
export async function apiFetchCached<T>(
  path: string,
  revalidateSeconds: number = 60
): Promise<T> {
  const url = `${API_BASE()}${path}`

  if (revalidateSeconds <= 0) {
    return fetchJson<T>(url, 5000)
  }

  const now = Date.now()
  const hit = cacheGet(url)

  // Fresh hit — return immediately.
  if (hit && hit.expires > now) {
    return hit.value as T
  }

  // Stale hit — serve stale instantly and refresh in the background (SWR).
  if (hit) {
    if (!hit.refreshing) {
      hit.refreshing = true
      fetchJson<T>(url, 5000)
        .then((fresh) => cacheSet(url, fresh, revalidateSeconds))
        .catch(() => {
          /* keep serving stale on failure */
        })
        .finally(() => {
          hit.refreshing = false
        })
    }
    return hit.value as T
  }

  // Cold miss — fetch, cache, return.
  const value = await fetchJson<T>(url, 5000)
  cacheSet(url, value, revalidateSeconds)
  return value
}

/**
 * Safe fetch — returns null instead of throwing on error
 * Useful for optional data (sidebar, related articles, etc.)
 */
export async function apiFetchSafe<T>(
  path: string,
  revalidateSeconds: number = 60
): Promise<T | null> {
  try {
    return await apiFetchCached<T>(path, revalidateSeconds)
  } catch {
    return null
  }
}

/* ─── Cloudflare Image Resizing (/cdn-cgi/image/) ──────────────────────────
 * The R2 custom domain cdn.beritana.com is Cloudflare-proxied, and Image
 * Resizing is enabled, so we can transform on the fly:
 *
 *   https://cdn.beritana.com/cdn-cgi/image/width=640,format=auto,quality=80/<path>
 *
 * `format=auto` negotiates AVIF/WebP from the browser's Accept header (verified:
 * 320w drops a 57 KB WebP to ~10 KB AVIF). Toggle off with PUBLIC_CDN_RESIZE
 * to serve originals untouched.
 * ────────────────────────────────────────────────────────────────────────── */

// Includes 160 so small thumbnail slots (e.g. 80px, which want ~160px on 2x
// displays) don't download the 320w candidate — the browser picks the smallest
// that satisfies `sizes`, cutting bytes on list/sidebar thumbnails.
const CDN_RESIZE_WIDTHS = [160, 320, 640, 960, 1280] as const

// Default compression quality for the resize transform. WebP at 70 is
// visually close to the original for news photos (faces/text stay crisp)
// while still cutting ~72% off the original bytes. q50 saved a bit more
// but risked visible softening; q70 is the safe sweet spot. Tune here once.
const CDN_RESIZE_QUALITY = 70

function cdnBase(): string {
  return (process.env.PUBLIC_CDN_BASE_URL || 'https://cdn.beritana.com').replace(/\/$/, '')
}

/** True only for images actually served by the Cloudflare-proxied CDN. */
function isCdnUrl(url: string): boolean {
  return url.startsWith(cdnBase()) || url.includes('cdn.beritana.com')
}

/**
 * Reverse a /cdn-cgi/image/ transform back to the plain object URL, so a single
 * resized URL can be re-expanded into a multi-width srcset. No-op if not a
 * transform URL.
 */
export function stripCdnResize(url: string): string {
  const marker = '/cdn-cgi/image/'
  const i = url.indexOf(marker)
  if (i === -1) return url
  const base = url.slice(0, i) // origin (e.g. https://cdn.beritana.com)
  const afterMarker = url.slice(i + marker.length)
  // afterMarker = "width=400,format=auto,quality=80/<path>" — drop the option
  // segment (up to the first slash) to recover "<path>".
  const slash = afterMarker.indexOf('/')
  const path = slash === -1 ? afterMarker : afterMarker.slice(slash + 1)
  return `${base}/${path}`
}

/**
 * Reverse a wsrv.nl proxy URL back to the plain object URL (reads the `url`
 * query param and re-adds https://). No-op if not a wsrv URL.
 */
export function stripWsrv(url: string): string {
  if (!url.includes('wsrv.nl')) return url
  try {
    const u = new URL(url)
    const src = u.searchParams.get('url')
    if (!src) return url
    return src.startsWith('http') ? src : `https://${src}`
  } catch {
    return url
  }
}

/**
 * images.weserv.nl free resize proxy:
 *   https://wsrv.nl/?url=<host/path>&w=640&output=webp&q=50
 * `url` must be WITHOUT the scheme (wsrv prepends https://). `output=webp`
 * negotiates a modern format; `we=1` (without-enlargement) avoids upscaling.
 */
function buildWsrvUrl(cdnUrl: string, width: number, quality: number): string {
  // wsrv wants the source as "host/path" (no scheme).
  const noScheme = cdnUrl.replace(/^https?:\/\//, '')
  // IMPORTANT: encode with encodeURIComponent, NOT URLSearchParams. The latter
  // encodes spaces as "+", which wsrv forwards literally to the CDN origin —
  // but object keys with spaces are stored as %20, so a "+" yields a 404 and a
  // broken image (e.g. avatars like "... (1)-xxxx.webp"). encodeURIComponent
  // turns spaces into %20, which the origin resolves correctly.
  const url = encodeURIComponent(noScheme)
  return `https://wsrv.nl/?url=${url}&w=${width}&output=webp&q=${quality}&we=1`
}

/**
 * Resize a CDN image URL to `width` using the configured provider
 * (IMG_RESIZE_PROVIDER). No-op (returns the input) when the provider is 'off',
 * the URL isn't a CDN URL, or it's already a transform URL.
 *
 * Name kept as `buildCdnResizeUrl` for backward compatibility with existing
 * call sites and getImageSrcSet.
 */
export function buildCdnResizeUrl(
  url: string,
  width: number,
  quality = CDN_RESIZE_QUALITY
): string {
  if (IMG_RESIZE_PROVIDER === 'off') return url
  if (!isCdnUrl(url)) return url
  if (url.includes('/cdn-cgi/image/') || url.includes('wsrv.nl')) return url

  if (IMG_RESIZE_PROVIDER === 'wsrv') {
    return buildWsrvUrl(url, width, quality)
  }

  // provider === 'cdn' → Cloudflare Image Resizing (/cdn-cgi/image/)
  const base = cdnBase()
  let path = url
  if (url.startsWith(base)) path = url.slice(base.length)
  else {
    const idx = url.indexOf('cdn.beritana.com')
    if (idx !== -1) path = url.slice(idx + 'cdn.beritana.com'.length)
  }
  path = path.replace(/^\//, '')
  return `${base}/cdn-cgi/image/width=${width},format=auto,quality=${quality}/${path}`
}

/**
 * Build a responsive `srcset` string for a CDN image (one candidate per width).
 * Returns '' when resizing is disabled or the URL isn't a transformable CDN URL,
 * so callers can safely omit the attribute.
 */
export function getImageSrcSet(
  url: string | null | undefined,
  widths: readonly number[] = CDN_RESIZE_WIDTHS,
  quality = CDN_RESIZE_QUALITY
): string {
  if (!url || IMG_RESIZE_PROVIDER === 'off') return ''
  let raw = url.trim()
  if (raw === '') return ''

  // Callers often pass an already-transformed URL (getImageUrl({width})).
  // Recover the plain object URL so we can emit multiple widths from it.
  if (raw.includes('/cdn-cgi/image/')) raw = stripCdnResize(raw)
  else if (raw.includes('wsrv.nl')) raw = stripWsrv(raw)

  // Local /public assets (logo, fallback, static icons) and data URIs are NOT
  // on the CDN — never rewrite them (those paths would 404 / break).
  if (raw.startsWith('/') || raw.startsWith('data:')) return ''
  // Only CDN-hosted media (absolute cdn.beritana.com URL, or a bare backend
  // storage path like "media/..." / "posts/...") is transformable.
  if (raw.startsWith('http') && !isCdnUrl(raw)) return ''

  const resolved = getImageUrl(raw)
  if (!isCdnUrl(resolved) || resolved.includes('/cdn-cgi/image/') || resolved.includes('wsrv.nl')) return ''
  return widths
    .map((w) => `${buildCdnResizeUrl(resolved, w, quality)} ${w}w`)
    .join(', ')
}

/**
 * Get full image URL from backend response.
 * All images are served from cdn.beritana.com (Cloudflare R2).
 *
 * Handles both relative (posts/2026/08/foto.webp) and absolute (https://...) URLs.
 *
 * When `options.width` is given and PUBLIC_CDN_RESIZE is on, a CDN URL is
 * returned through the Cloudflare /cdn-cgi/image/ transform at that width.
 * Without a width (or with resizing off) the original object URL is returned,
 * so existing call sites keep their current behaviour.
 *
 * @param url - Image URL from API
 * @param options - width triggers a CDN transform; quality tunes it
 */
export function getImageUrl(
  url: string | null | undefined,
  options?: { width?: number; quality?: number; skipProxy?: boolean }
): string {
  if (!url || url.trim() === '' || url === 'null' || url === 'undefined') return '/images/fallback-thumb.svg'

  const CDN_BASE = cdnBase()

  const withResize = (u: string): string =>
    options?.width ? buildCdnResizeUrl(u, options.width, options.quality ?? CDN_RESIZE_QUALITY) : u

  // Already a CDN URL — return directly (optionally resized)
  if (url.startsWith(CDN_BASE)) return withResize(url)
  if (url.includes('cdn.beritana.com')) return withResize(url)

  // ─── CLOUDINARY (disabled — kept for future use) ─────────────────
  // Jika suatu saat kembali menggunakan Cloudinary untuk transform on-the-fly,
  // uncomment blok di bawah dan hapus/ubah logika CDN di atas.
  //
  // if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
  //   const path = url.replace(/^https?:\/\/localhost(:\d+)?/, '')
  //   const baseUrl = (process.env.API_BASE_URL || '').replace('/api', '')
  //   return baseUrl ? applyImageTransform(`${baseUrl}${path}`, options) : `/images/fallback-thumb.svg`
  // }
  // if (url.startsWith('http')) return applyImageTransform(url, options)
  // ─────────────────────────────────────────────────────────────────

  // Sanitize localhost URLs — rewrite path to CDN
  if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    const path = url.replace(/^https?:\/\/localhost(:\d+)?/, '')
    const cleanPath = path.startsWith('/') ? path.substring(1) : path
    return withResize(`${CDN_BASE}/${cleanPath}`)
  }

  // Any other absolute URL (external source, legacy Cloudinary, etc.) — return as-is.
  // Not a CDN URL, so no transform is possible.
  if (url.startsWith('http')) return url

  // Relative path from backend storage — serve from CDN (optionally resized)
  const cleanPath = url.startsWith('/') ? url.substring(1) : url
  return withResize(`${CDN_BASE}/${cleanPath}`)
}

/* ─────────────────────────────────────────────────────────────────────────
 * CLOUDINARY TRANSFORMS — DISABLED (kept for future use)
 *
 * Semua gambar sekarang dilayani langsung dari cdn.beritana.com (Cloudflare R2)
 * dan sudah dioptimasi di sisi backend saat upload, sehingga transform URL
 * tidak diperlukan lagi.
 *
 * Jika suatu saat Cloudinary kembali digunakan untuk transform on-the-fly,
 * uncomment kembali kedua fungsi di bawah dan panggil applyImageTransform()
 * dari getImageUrl().
 * ───────────────────────────────────────────────────────────────────────── */

/*
/**
 * Apply image transforms based on the image source.
 * - Cloudinary: inject f_auto, q_auto, w_XXX, c_limit
 * - Picsum: rewrite URL dimensions to match requested width
 * - External images (detik, etc): proxy via Cloudinary fetch for auto-format + resize
 * - Others: return unchanged
 *\/
function applyImageTransform(
  url: string,
  options?: { width?: number; quality?: string; skipProxy?: boolean }
): string {
  // Cloudinary (already hosted) — always transform
  if (url.includes('res.cloudinary.com')) return applyCloudinaryTransform(url, options)

  // Picsum — rewrite /seed/xxx/W/H to smaller dimensions
  if (url.includes('picsum.photos') && options?.width) {
    return url.replace(
      /\/(\d+)\/(\d+)$/,
      (_, w, h) => {
        const origW = parseInt(w)
        const origH = parseInt(h)
        const ratio = origH / origW
        const newW = Math.min(options.width!, origW)
        const newH = Math.round(newW * ratio)
        return `/${newW}/${newH}`
      }
    )
  }

  // External images — proxy via Cloudinary fetch for auto-format + resize
  // Skip proxy for LCP images (adds latency due to extra hop)
  if (!options?.skipProxy && (url.startsWith('https://') || url.startsWith('http://')) && !url.includes('picsum.photos')) {
    const quality = options?.quality || 'auto'
    const width = options?.width || 800
    const transforms = `f_auto,q_${quality},w_${width},c_limit`
    // Cloudinary fetch requires https source — upgrade if needed
    const sourceUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url
    return `https://res.cloudinary.com/beritana/image/fetch/${transforms}/${sourceUrl}`
  }

  return url
}

/**
 * Apply Cloudinary on-the-fly transforms (f_auto, q_auto, w_XXX) to Cloudinary URLs.
 * Non-Cloudinary URLs are returned unchanged.
 * If no width specified, defaults to 800 to prevent oversized images.
 *\/
function applyCloudinaryTransform(
  url: string,
  options?: { width?: number; quality?: string }
): string {
  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url

  const quality = options?.quality || 'auto'
  const width = options?.width || 800 // Default max width to prevent oversized delivery
  const transforms = [`f_auto`, `q_${quality}`, `w_${width}`, 'c_limit']

  // Cloudinary URL pattern: .../upload/v123456/path.jpg
  // Insert transforms after /upload/
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url

  const beforeUpload = url.substring(0, uploadIndex + '/upload/'.length)
  const afterUpload = url.substring(uploadIndex + '/upload/'.length)

  // Check if transforms already applied (starts with f_ or q_ or w_)
  // If width transform is missing but other transforms exist, inject width
  if (/^[fqwch]_/.test(afterUpload)) {
    // Already has transforms — check if width is present
    if (/w_\d+/.test(afterUpload)) return url
    // Insert width transform into existing transform chain
    const transformEnd = afterUpload.indexOf('/')
    if (transformEnd === -1) return url
    const existingTransforms = afterUpload.substring(0, transformEnd)
    const rest = afterUpload.substring(transformEnd)
    return `${beforeUpload}${existingTransforms},w_${width},c_limit${rest}`
  }

  return `${beforeUpload}${transforms.join(',')}/${afterUpload}`
}
*/

/**
 * Default tiny 10x10 gray blur placeholder (base64 encoded)
 * Used when article.thumbnail_blur is not available from BE
 */
const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTJlOGYwIi8+PC9zdmc+'

/**
 * Returns blur placeholder props for next/image.
 * Uses thumbnail_blur from BE if available, otherwise a default gray placeholder.
 */
export function getBlurProps(thumbnailBlur?: string | null): { placeholder: 'blur'; blurDataURL: string } {
  return {
    placeholder: 'blur',
    blurDataURL: thumbnailBlur || DEFAULT_BLUR_DATA_URL,
  }
}
