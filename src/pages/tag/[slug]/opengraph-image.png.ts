import type { APIRoute } from 'astro'
import { fetchTagArticles } from '@/lib/data'
import { brandOgImage } from '@/lib/og'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!
  let tagName = slug.replace(/-/g, ' ')
  try {
    const res = await fetchTagArticles(slug, 1)
    if (res?.tag?.name) tagName = res.tag.name
  } catch {
    // default
  }
  return brandOgImage({ label: 'Tag', title: `#${tagName}` })
}
