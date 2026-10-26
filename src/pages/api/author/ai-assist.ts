import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

/** Proxy AI assist to backend (BE does the LLM call). Requires auth. */
export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ success: false, message: 'Login dulu' }, { status: 401 })
  try {
    const body = await request.text()
    const res = await fetch(`${API_BASE()}/author/ai-assist`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY(),
        Authorization: authHeader,
      },
      body,
      signal: AbortSignal.timeout(60000),
    })
    const data = await res.json().catch(() => ({}))
    return jsonResponse(data, { status: res.status })
  } catch {
    return jsonResponse({ success: false, message: 'AI sedang sibuk atau timeout. Coba lagi.' }, { status: 503 })
  }
}
