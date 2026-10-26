/**
 * Centralized environment accessor.
 *
 * Why this exists:
 *  - In Next.js, code read `process.env.X` directly, and `NEXT_PUBLIC_*` vars
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
 * `NEXT_PUBLIC_*` vars used in client components are also injected via Vite
 * `define` in astro.config.mjs, so `process.env.NEXT_PUBLIC_*` literals keep
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
export const SITE_URL_RAW = env('NEXT_PUBLIC_SITE_URL', 'https://beritana.com')
export const SITE_NAME = env('NEXT_PUBLIC_SITE_NAME', 'Beritana')
export const API_BASE_URL = env('API_BASE_URL', 'https://cms.beritana.com/api')
export const API_SECRET_KEY = env('API_SECRET_KEY', '')
export const CDN_BASE_URL = env('NEXT_PUBLIC_CDN_BASE_URL', 'https://cdn.beritana.com')
// Cloudflare Image Resizing toggle. Enabled unless explicitly set to 'false'/'0'.
export const CDN_RESIZE_ENABLED = (() => {
  const v = env('NEXT_PUBLIC_CDN_RESIZE', 'true').toLowerCase()
  return v !== 'false' && v !== '0' && v !== ''
})()
// Feature toggles. Default OFF — set to 'true' to render again. Keeping the
// components in the codebase but not mounting them removes their island JS and
// their /api calls (AdBanner.js, LiveEventBadge.js + /api/live) from the page.
const isOn = (key: string) => {
  const v = env(key, '').toLowerCase()
  return v === 'true' || v === '1'
}
export const ENABLE_ADS = isOn('NEXT_PUBLIC_ENABLE_ADS')
export const ENABLE_LIVE_EVENT = isOn('NEXT_PUBLIC_ENABLE_LIVE_EVENT')

export const REVALIDATE_SECRET = env('REVALIDATE_SECRET', '')
export const INDEXNOW_KEY = env('INDEXNOW_KEY', '')
export const GA_ID = env('NEXT_PUBLIC_GA_ID', '')
export const ADSENSE_ID = env('NEXT_PUBLIC_ADSENSE_ID', '')
export const GTM_ID = env('NEXT_PUBLIC_GTM_ID', '')
export const GOOGLE_VERIFICATION = env('NEXT_PUBLIC_GOOGLE_VERIFICATION', '')
export const BING_VERIFICATION = env('NEXT_PUBLIC_BING_VERIFICATION', '')
export const YANDEX_VERIFICATION = env('NEXT_PUBLIC_YANDEX_VERIFICATION', '')
