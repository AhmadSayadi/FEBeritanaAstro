import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const q = url.searchParams.toString()
  return proxyGet(`/authors${q ? `?${q}` : ''}`, { fallback: { data: [] } })
}
