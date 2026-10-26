import type { APIRoute } from 'astro'

export const prerender = false

/**
 * Legacy AMP URLs (e.g. /amp/news/474) — 410 Gone.
 *
 * These pages no longer exist and their numeric IDs can't be mapped to current
 * slugs. 410 tells Google "permanently gone, drop from index, stop crawling",
 * which preserves crawl budget better than a 404. Mirrors Next's amp/[...path].
 */
export const GET: APIRoute = () =>
  new Response('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
