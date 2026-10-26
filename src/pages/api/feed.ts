import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = () => proxyGet('/feed', { fallback: { data: [] } })
