import type { APIRoute } from 'astro'
import { apiFetchSafe } from '@/lib/api'
import { brandOgImage } from '@/lib/og'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!
  let title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  try {
    const result = await apiFetchSafe<{ data: { title?: string } }>(`/pages/${slug}`, 600)
    if (result?.data?.title) title = result.data.title
  } catch {
    // default
  }
  return brandOgImage({ title })
}
