import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ params, url }) => {
  const slug = params.slug!
  const page = url.searchParams.get('page') || '1'
  const limit = url.searchParams.get('limit') || '12'
  return proxyGet(`/categories/${slug}?page=${page}&limit=${limit}`, {
    fallback: { data: [], meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 } },
    cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
  })
}
