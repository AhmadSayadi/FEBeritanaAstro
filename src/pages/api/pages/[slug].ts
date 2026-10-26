import type { APIRoute } from 'astro'
import { proxyGet } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = ({ params }) =>
  proxyGet(`/pages/${params.slug}`, { fallback: { data: null } })
