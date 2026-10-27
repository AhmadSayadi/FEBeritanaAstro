/**
 * Shared, deduped client-side fetch for /api/navigation.
 *
 * Problem it solves: Header, BreakingNewsBanner, and (when ads are on) AdBanner
 * each fetched /api/navigation independently on mount — 2-3 identical requests
 * per page load, each invoking the Worker + a backend call. This caches the
 * payload in-memory (per tab) + sessionStorage, and shares a single in-flight
 * promise so concurrent callers hit the network only once.
 *
 * The payload is the same site config for everyone, so a short sessionStorage
 * TTL keeps subsequent navigations instant without going stale for long.
 */

export interface NavigationData {
  site_name?: string
  site_logo?: string
  site_logo_footer?: string
  menu_items?: unknown[]
  categories?: { slug: string; color?: string; name?: string; order?: number }[]
  header_categories?: { slug: string; color?: string; name?: string; order?: number }[]
  ads_enabled?: boolean
  social?: Record<string, string | undefined>
  [key: string]: unknown
}

const SS_KEY = 'nav_cache_v1'
const TTL_MS = 5 * 60 * 1000 // 5 minutes

let memory: NavigationData | null = null
let inFlight: Promise<NavigationData | null> | null = null

function readSession(): NavigationData | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { t: number; d: NavigationData }
    if (!parsed?.t || Date.now() - parsed.t > TTL_MS) return null
    return parsed.d
  } catch {
    return null
  }
}

function writeSession(data: NavigationData): void {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ t: Date.now(), d: data }))
  } catch {
    /* sessionStorage full/unavailable — ignore, memory cache still works */
  }
}

/**
 * Get the navigation/site-config payload, fetching at most once per tab per TTL.
 * Returns null on failure so callers keep their defaults.
 */
export function getNavigation(): Promise<NavigationData | null> {
  if (memory) return Promise.resolve(memory)

  const cached = readSession()
  if (cached) {
    memory = cached
    return Promise.resolve(cached)
  }

  if (inFlight) return inFlight

  inFlight = fetch('/api/navigation')
    .then((res) => res.json())
    .then((data: NavigationData) => {
      memory = data
      writeSession(data)
      return data
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null
    })

  return inFlight
}
