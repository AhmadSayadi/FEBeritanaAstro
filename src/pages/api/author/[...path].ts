import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

/**
 * Proxy all /api/author/* to the Laravel backend. Supports JSON and
 * multipart/form-data bodies (preserving the boundary). Mirrors Next's
 * author/[...path] handler.
 */
async function proxy(request: Request, path: string | undefined, method: string): Promise<Response> {
  const pathStr = path || ''
  const authHeader = request.headers.get('Authorization')
  const contentType = request.headers.get('Content-Type') || ''

  const headers: Record<string, string> = { Accept: 'application/json', 'X-API-Key': API_KEY() }
  if (authHeader) headers['Authorization'] = authHeader

  const fetchOptions: RequestInit = { method, headers }

  if (method !== 'GET') {
    if (contentType.includes('multipart/form-data')) {
      fetchOptions.body = await request.arrayBuffer()
      headers['Content-Type'] = contentType
    } else {
      headers['Content-Type'] = 'application/json'
      fetchOptions.body = await request.text()
    }
  }

  try {
    const res = await fetch(`${API_BASE()}/author/${pathStr}`, fetchOptions)
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
