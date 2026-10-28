/**
 * Centralized environment accessor.
 *
 * Why this exists:
 *  - In Next.js, code read `process.env.X` directly, and `PUBLIC_*` vars
 *    were inlined into client bundles at build time.
 *  - In Astro:
 *      • During dev/build, Vite loads `.env` into `import.meta.env`.
 *      • At runtime (`node dist/server/entry.mjs`), `.env` is NOT auto-loaded;
 *        the hosting platform (Vercel/Cloudflare/shared hosting) provides real
 *        `process.env` values.
 *
 * This helper reads from both sources so the migrated library code behaves
 * identically to the old Next.js app in dev, build, and production.
 *
 * `PUBLIC_*` vars used in client components are also injected via Vite
 * `define` in astro.config.mjs, so `process.env.PUBLIC_*` literals keep
 * working inside React islands.
 */

type EnvRecord = Record<string, string | undefined>

// import.meta.env is populated by Vite (dev + build) from .env files.
const viteEnv: EnvRecord =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: EnvRecord }).env
    ? ((import.meta as unknown as { env: EnvRecord }).env)
    : {}

// process.env is populated by the host at runtime (and by Node during dev).
const procEnv: EnvRecord =
  typeof process !== 'undefined' && process.env ? (process.env as EnvRecord) : {}

export function env(key: string, fallback = ''): string {
  const v = viteEnv[key] ?? procEnv[key]
  return v === undefined || v === null ? fallback : String(v)
}

// Commonly used values, resolved once.
export const SITE_URL_RAW = env('PUBLIC_SITE_URL', 'https://beritana.com')
export const SITE_NAME = env('PUBLIC_SITE_NAME', 'Beritana')
export const API_BASE_URL = env('API_BASE_URL', 'https://cms.beritana.com/api')
export const API_SECRET_KEY = env('API_SECRET_KEY', '')
export const CDN_BASE_URL = env('PUBLIC_CDN_BASE_URL', 'https://cdn.beritana.com')
// Cloudflare Image Resizing toggle. Enabled unless explicitly set to 'false'/'0'.
export const CDN_RESIZE_ENABLED = (() => {
  const v = env('PUBLIC_CDN_RESIZE', 'true').toLowerCase()
  return v !== 'false' && v !== '0' && v !== ''
})()

// Image resize PROVIDER — chooses how thumbnails/hero images are resized.
//   'off'  → serve the original CDN file untouched (no resize). Safe default.
//   'cdn'  → Cloudflare Image Resizing (/cdn-cgi/image/). Free tier is only
//            5k unique transforms/mo (we hit the 9422 limit), so avoid unless
//            on a paid plan.
//   'wsrv' → images.weserv.nl, a free unlimited resize proxy. Good "kere hore"
//            option; images pass through a third-party host.
// Falls back to CDN_RESIZE_ENABLED for backward compatibility: if the provider
// var is unset but PUBLIC_CDN_RESIZE=true, behaves as 'cdn'.
export const IMG_RESIZE_PROVIDER = (() => {
  const v = env('PUBLIC_IMG_RESIZE_PROVIDER', '').toLowerCase().trim()
  if (v === 'off' || v === 'cdn' || v === 'wsrv') return v
  return CDN_RESIZE_ENABLED ? 'cdn' : 'off'
})() as 'off' | 'cdn' | 'wsrv'
// Feature toggles. Default OFF — set to 'true' to render again. Keeping the
// components in the codebase but not mounting them removes their island JS and
// their /api calls (AdBanner.js, LiveEventBadge.js + /api/live) from the page.
const isOn = (key: string) => {
  const v = env(key, '').toLowerCase()
  return v === 'true' || v === '1'
}
export const ENABLE_ADS = isOn('PUBLIC_ENABLE_ADS')
export const ENABLE_LIVE_EVENT = isOn('PUBLIC_ENABLE_LIVE_EVENT')

// CDN cache TTLs (seconds) for the middleware Cache-Control headers. Tunable via
// env so freshness can be adjusted WITHOUT a code change — just update the var
// in wrangler.toml [vars] (or the dashboard) and redeploy.
//   LISTING_TTL = how long listings (homepage, category, tag, ...) stay "fresh"
//                 at the CDN before the Worker recomputes. Lower = newer
//                 articles appear sooner, but the Worker runs more often
//                 (watch the free-tier request budget). 30s is fine at low/med
//                 traffic; raise toward 120 if Worker invocations get tight.
//   ARTICLE_TTL = same idea for article detail pages (content rarely changes).
const num = (key: string, fallback: number) => {
  const n = parseInt(env(key, ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}
export const LISTING_TTL = num('LISTING_TTL', 30)
export const ARTICLE_TTL = num('ARTICLE_TTL', 600)

export const REVALIDATE_SECRET = env('REVALIDATE_SECRET', '')
export const INDEXNOW_KEY = env('INDEXNOW_KEY', '')
export const GA_ID = env('PUBLIC_GA_ID', '')
export const ADSENSE_ID = env('PUBLIC_ADSENSE_ID', '')
export const GTM_ID = env('PUBLIC_GTM_ID', '')
export const GOOGLE_VERIFICATION = env('PUBLIC_GOOGLE_VERIFICATION', '')
export const BING_VERIFICATION = env('PUBLIC_BING_VERIFICATION', '')
export const YANDEX_VERIFICATION = env('PUBLIC_YANDEX_VERIFICATION', '')
