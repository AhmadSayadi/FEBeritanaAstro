/**
 * Article sitemap chunk — equivalent of Next's sitemap-articles/[chunk]/route.ts.
 * Serves up to 1000 article URLs per page at /sitemap-articles/{n}.xml.
 * URLs use the article's real category slug to match the canonical.
 */
import type { APIRoute } from 'astro'
import { apiFetchCached, getImageUrl } from '@/lib/api'
import type { SitemapArticle } from '@/lib/types'
import { SITE_URL_RAW } from '@/lib/env'

export const prerender = false

const CHUNK_SIZE = 1000

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const resolveCategorySlug = (a: SitemapArticle): string => {
  if (a.category_slug) return a.category_slug
  if (a.categorySlug) return a.categorySlug
  if (typeof a.category === 'string' && a.category) return a.category
  if (a.category && typeof a.category === 'object' && a.category.slug) return a.category.slug
  return 'berita'
}

export const GET: APIRoute = async ({ params }) => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')
  const chunkNum = parseInt((params.chunk || '1').replace('.xml', ''), 10) || 1

  let articles: SitemapArticle[] = []
  try {
    const res = await apiFetchCached<{ data: SitemapArticle[] }>('/sitemap/articles?limit=50000', 3600)
    articles = res.data || []
  } catch {
    articles = []
  }

  const start = (chunkNum - 1) * CHUNK_SIZE
  const chunkArticles = articles.slice(start, start + CHUNK_SIZE)

  const urls = chunkArticles.map((a) => {
    const imageUrl = a.thumbnail_url ? getImageUrl(a.thumbnail_url, { width: 1200 }) : ''
    return `  <url>
    <loc>${siteUrl}/${resolveCategorySlug(a)}/${a.slug}</loc>
    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageUrl ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>${a.title ? `
      <image:title>${escapeXml(a.title)}</image:title>` : ''}
    </image:image>` : ''}
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
