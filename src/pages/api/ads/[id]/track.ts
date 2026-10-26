import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

/** Fire-and-forget ad tracking. */
export const POST: APIRoute = async ({ params, request }) => {
  const body = await request.text()
  try {
    await fetch(`${API_BASE}/ads/${params.id}/track`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body,
    })
  } catch {
    /* fire & forget */
  }
  return jsonResponse({ success: true })
}
