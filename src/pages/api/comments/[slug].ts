import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse, proxyMethod } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  try {
    const res = await fetch(`${API_BASE}/articles/${params.slug}/comments`, {
      headers: { Accept: 'application/json', 'X-API-Key': API_KEY },
      cache: 'no-store',
    })
    if (!res.ok) return jsonResponse({ data: [] })
    return jsonResponse(await res.json())
  } catch {
    return jsonResponse({ data: [] })
  }
}

export const POST: APIRoute = ({ params, request }) =>
  proxyMethod('POST', `/articles/${params.slug}/comments`, request)
