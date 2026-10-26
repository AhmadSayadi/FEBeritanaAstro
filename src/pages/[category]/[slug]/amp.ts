import type { APIRoute } from 'astro'

export const prerender = false

/**
 * Legacy AMP article URLs: /{category}/{slug}/amp → 308 to the canonical
 * /{category}/{slug}. Mirrors Next's next.config.mjs redirect.
 *
 * Why a redirect here but 410 under /amp/*: these URLs map 1:1 onto content
 * that still exists, so sending crawlers to the canonical page preserves the
 * link equity. The /amp/* URLs use legacy numeric IDs that can't be resolved
 * to a slug, so those stay 410 Gone.
 */
export const GET: APIRoute = ({ params }) =>
  new Response(null, {
    status: 308,
    headers: {
      Location: `/${params.category}/${params.slug}`,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
