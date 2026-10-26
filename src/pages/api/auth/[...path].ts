import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

/**
 * Proxy all /api/auth/* to the Laravel backend, injecting X-API-Key and
 * forwarding Authorization. Mirrors Next's auth/[...path] handler.
 */
async function proxy(request: Request, path: string | undefined, method: string): Promise<Response> {
  const pathStr = path || ''
  const authHeader = request.headers.get('Authorization')

  const headers: Record<string, string> = { Accept: 'application/json', 'X-API-Key': API_KEY }
  const hasBody = method === 'POST' || method === 'PUT'
  if (hasBody) headers['Content-Type'] = 'application/json'
  if (authHeader) headers['Authorization'] = authHeader

  try {
    const res = await fetch(`${API_BASE}/auth/${pathStr}`, {
      method,
      headers,
      body: hasBody ? await request.text() : undefined,
    })
    const data = await res.json()
    return jsonResponse(data, { status: res.status })
  } catch {
    return jsonResponse({ success: false, message: 'Server tidak tersedia' }, { status: 503 })
  }
}

export const GET: APIRoute = ({ request, params }) => proxy(request, params.path, 'GET')
export const POST: APIRoute = ({ request, params }) => proxy(request, params.path, 'POST')
export const PUT: APIRoute = ({ request, params }) => proxy(request, params.path, 'PUT')
export const DELETE: APIRoute = ({ request, params }) => proxy(request, params.path, 'DELETE')
