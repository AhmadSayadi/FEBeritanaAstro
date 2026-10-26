import type { APIRoute } from 'astro'
import { REVALIDATE_SECRET, INDEXNOW_KEY, SITE_URL_RAW } from '@/lib/env'
import { jsonResponse } from '@/lib/api-proxy'

export const prerender = false

const SECRET = REVALIDATE_SECRET || 'beritana-revalidate-2026'

async function pingIndexNow(targetUrl: string) {
  if (!INDEXNOW_KEY) return
  const host = new URL(targetUrl).host
  await fetch(
    `https://api.indexnow.org/indexnow?url=${encodeURIComponent(targetUrl)}&key=${INDEXNOW_KEY}&keyLocation=https://${host}/${INDEXNOW_KEY}.txt`
  ).catch(() => {})
}

/**
 * Webhook called by the Laravel backend on publish/update.
 *
 * Note: Astro SSR renders on every request (no persisted ISR cache to clear),
 * so content is already fresh. The portable, still-useful job here is pinging
 * IndexNow (Bing/Yandex) for instant indexing — preserved from the Next handler.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')

    if (body.secret !== SECRET) {
      return jsonResponse({ success: false, message: 'Invalid secret' }, { status: 401 })
    }

    const { type, slug, category } = body

    if (type === 'article' && slug && category) {
      pingIndexNow(`${siteUrl}/${category}/${slug}`).catch(() => {})
    }

    return jsonResponse({
      success: true,
      revalidated: true,
      type: type ?? null,
      slug: slug ?? null,
      category: category ?? null,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return jsonResponse({ success: false, message: 'Invalid request body' }, { status: 400 })
  }
}
