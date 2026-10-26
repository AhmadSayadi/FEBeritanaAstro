import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  try {
    const res = await fetch(`${API_BASE()}/polls/${params.id}/results`, {
      headers: { Accept: 'application/json', 'X-API-Key': API_KEY() },
    })
    return jsonResponse(await res.json(), { status: res.status })
  } catch {
    return jsonResponse({ data: null }, { status: 503 })
  }
}
