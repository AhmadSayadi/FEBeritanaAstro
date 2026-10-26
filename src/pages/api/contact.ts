import type { APIRoute } from 'astro'
import { proxyMethod } from '@/lib/api-proxy'

export const prerender = false

export const POST: APIRoute = ({ request }) => proxyMethod('POST', '/contact', request)
