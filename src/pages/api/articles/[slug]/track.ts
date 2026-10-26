import type { APIRoute } from 'astro'
import { API_BASE, API_KEY } from '@/lib/api-proxy'

export const prerender = false

/** Fire-and-forget view tracking — always returns 204. */
export const POST: APIRoute = async ({ params, request }) => {
  const body = await request.text()
  try {
    await fetch(`${API_BASE()}/articles/${params.slug}/track`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-API-Key': API_KEY() },
      body,
    })
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 204 })
}
