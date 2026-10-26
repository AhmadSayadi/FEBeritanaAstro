import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const q = url.searchParams.toString()
  return proxyGet(`/articles${q ? `?${q}` : ''}`, {
    fallback: { data: [], meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 } },
  })
}
