/**
 * Shared backend-proxy helpers for Astro API endpoints (/api/*).
 *
 * The old Next.js route handlers were almost all thin proxies to the Laravel
 * backend that inject the X-API-Key header (and forward Authorization when
 * present). These helpers reproduce that behaviour exactly so each Astro
 * endpoint file stays tiny and consistent.
 */
import { env } from './env'

// Read per-call (not frozen at module load): on Cloudflare Workers the runtime
// env may not be populated when this module first loads, so capturing these as
// consts could freeze them to '' and send every proxied request without the
// API key.
const API_BASE = () => env('API_BASE_URL', 'https://cms.beritana.com/api')
const API_KEY = () => env('API_SECRET_KEY', '')

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init?.headers || {}) },
  })
}

/**
 * GET proxy — forwards a GET to `${API_BASE}${backendPath}` with the API key.
 * On any failure returns `fallback` (default `{ data: null }`) with status 200,
 * matching the original handlers' graceful-degradation behaviour.
 */
export async function proxyGet(
  backendPath: string,
  opts: {
    revalidate?: number
    fallback?: unknown
    cacheControl?: string
    forwardAuth?: Request | null
  } = {}
): Promise<Response> {
  const { fallback = { data: null }, cacheControl, forwardAuth } = opts
  const headers: Record<string, string> = { Accept: 'application/json', 'X-API-Key': API_KEY() }
  const auth = forwardAuth?.headers.get('Authorization')
  if (auth) headers['Authorization'] = auth

  try {
    const res = await fetch(`${API_BASE()}${backendPath}`, { headers })
    if (!res.ok) return jsonResponse(fallback)
    const data = await res.json()
    return jsonResponse(data, cacheControl ? { headers: { 'Cache-Control': cacheControl } } : undefined)
  } catch {
    return jsonResponse(fallback)
  }
}

/**
 * Method proxy (POST/PUT/PATCH/DELETE) — forwards the request body + optional
 * Authorization, returns the backend JSON with its status code.
 */
export async function proxyMethod(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  backendPath: string,
  request: Request,
  opts: {
    requireAuth?: boolean
    unauthorizedBody?: unknown
    errorStatus?: number
    errorBody?: unknown
  } = {}
): Promise<Response> {
  const {
    requireAuth = false,
    unauthorizedBody = { success: false, message: 'Login dulu' },
    errorStatus = 503,
    errorBody = { success: false, message: 'Server tidak tersedia' },
  } = opts

  const authHeader = request.headers.get('Authorization')
  if (requireAuth && !authHeader) {
    return jsonResponse(unauthorizedBody, { status: 401 })
  }

  const hasBody = method !== 'DELETE'
  const body = hasBody ? await request.text() : undefined

  const headers: Record<string, string> = { Accept: 'application/json', 'X-API-Key': API_KEY() }
  if (hasBody) headers['Content-Type'] = 'application/json'
  if (authHeader) headers['Authorization'] = authHeader

  try {
    const res = await fetch(`${API_BASE()}${backendPath}`, { method, headers, body })
    const data = await res.json().catch(() => ({}))
    return jsonResponse(data, { status: res.status })
  } catch {
    return jsonResponse(errorBody, { status: errorStatus })
  }
}

export { API_BASE, API_KEY, jsonResponse }
