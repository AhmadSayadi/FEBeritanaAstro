import type { APIRoute } from 'astro'
import { proxyGet, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const q = url.searchParams.get('q') || ''
  if (q.length < 2) return jsonResponse({ data: [] })
  return proxyGet(`/search/suggestions?q=${encodeURIComponent(q)}`, { fallback: { data: [] } })
}
