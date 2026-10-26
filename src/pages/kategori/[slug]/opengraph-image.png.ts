import type { APIRoute } from 'astro'
import { fetchCategoryArticles } from '@/lib/data'
import { brandOgImage, BRAND_COLOR } from '@/lib/og'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!
  let categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  let categoryColor = BRAND_COLOR

  try {
    const data = await fetchCategoryArticles(slug, 1, 1)
    if (data?.category) {
      categoryName = data.category.name || categoryName
      categoryColor = data.category.color || categoryColor
    }
  } catch {
    // defaults
  }

  return brandOgImage({ label: 'Kanal', title: categoryName, color: categoryColor })
}
