import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const q = url.searchParams.toString()
  return proxyGet(`/tags${q ? `?${q}` : ''}`, { fallback: { data: [] } })
}
