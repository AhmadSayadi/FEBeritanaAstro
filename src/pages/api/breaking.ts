import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = () =>
  proxyGet('/breaking', {
    fallback: { data: [] },
    cacheControl: 'public, s-maxage=30, stale-while-revalidate=60',
  })
