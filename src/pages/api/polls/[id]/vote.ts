import type { APIRoute } from 'astro'
import { proxyMethod } from '@/lib/api-proxy'

export const prerender = false

export const POST: APIRoute = ({ params, request }) =>
  proxyMethod('POST', `/polls/${params.id}/vote`, request, { errorBody: { success: false } })
