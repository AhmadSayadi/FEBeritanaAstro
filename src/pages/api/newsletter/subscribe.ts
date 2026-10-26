import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('Content-Type') || ''
  let body: string

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const fd = await request.formData()
    const obj: Record<string, string> = {}
    fd.forEach((value, key) => { obj[key] = String(value) })
    body = JSON.stringify(obj)
  } else {
    body = await request.text()
  }

  try {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body,
    })
    const data = await res.json().catch(() => ({}))
    return jsonResponse(data, { status: res.status })
  } catch {
    return jsonResponse({ success: false, message: 'Server tidak tersedia' }, { status: 503 })
  }
}
