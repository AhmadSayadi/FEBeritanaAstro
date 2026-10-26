import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const query = url.searchParams.toString()
  return proxyGet(`/ads/banner${query ? `?${query}` : ''}`, { fallback: { data: null } })
}
