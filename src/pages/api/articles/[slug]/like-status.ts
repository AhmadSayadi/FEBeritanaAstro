import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = async ({ params, request }) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ is_liked: false })
  try {
    const res = await fetch(`${API_BASE()}/articles/${params.slug}/like-status`, {
      headers: { Accept: 'application/json', 'X-API-Key': API_KEY(), Authorization: authHeader },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ is_liked: false }))
    return jsonResponse(data, { status: res.status })
  } catch {
    return jsonResponse({ is_liked: false })
  }
}
