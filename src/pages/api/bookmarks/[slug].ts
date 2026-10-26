import type { APIRoute } from 'astro'
import { proxyMethod } from '@/lib/api-proxy'

export const prerender = false

export const POST: APIRoute = ({ params, request }) =>
  proxyMethod('POST', `/bookmarks/${params.slug}`, request, { requireAuth: true, errorBody: { success: false } })

export const DELETE: APIRoute = ({ params, request }) =>
  proxyMethod('DELETE', `/bookmarks/${params.slug}`, request, { requireAuth: true, errorBody: { success: false } })
