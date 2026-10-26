import type { APIRoute } from 'astro'
import { API_BASE, API_KEY, jsonResponse } from '@/lib/api-proxy'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ success: false, message: 'Login dulu' }, { status: 401 })

  try {
    const incomingForm = await request.formData()
    const outgoingForm = new FormData()
    for (const [key, value] of incomingForm.entries()) {
      if (value instanceof File) outgoingForm.append(key, value, value.name)
      else outgoingForm.append(key, value)
    }

    const res = await fetch(`${API_BASE()}/upload/image`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-API-Key': API_KEY(), Authorization: authHeader },
      body: outgoingForm,
    })
    const data = await res.json().catch(() => ({}))
    return jsonResponse(data, { status: res.status })
  } catch (err) {
    console.error('[upload/image]', err)
    return jsonResponse({ success: false, message: 'Upload gagal' }, { status: 503 })
  }
}
