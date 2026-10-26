import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

/**
 * Proxy artikel per-penulis dengan paging.
 * GET /api/authors/{slug}/articles?page=N → {API_BASE}/authors/{slug}?page=N
 * Mengembalikan hanya bagian `articles` (data + meta) agar payload ringan.
 */
export const GET: APIRoute = async ({ params, url }) => {
  const slug = params.slug!
  const page = url.searchParams.get('page') || '1'
  try {
    const res = await fetch(
      `${API_BASE}/authors/${encodeURIComponent(slug)}?page=${encodeURIComponent(page)}`,
      { headers: { Accept: 'application/json', 'X-API-Key': API_KEY }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return jsonResponse({ data: [], meta: null }, { status: res.status })
    const json = await res.json()
    return jsonResponse({ data: json.articles?.data ?? [], meta: json.articles?.meta ?? null })
  } catch {
    return jsonResponse({ data: [], meta: null }, { status: 503 })
  }
}
