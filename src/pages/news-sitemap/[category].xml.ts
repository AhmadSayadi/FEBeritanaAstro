/**
 * Per-category Google News sitemap — equivalent of Next's
 * news-sitemap/[category]/route.ts. URL: /news-sitemap/{category}.xml.
 * Only articles from the last 48h (Google News window).
 */
import type { APIRoute } from 'astro'
import { apiFetchCached, getImageUrl } from '@/lib/api'
import type { Article } from '@/lib/types'
import { SITE_URL_RAW, SITE_NAME } from '@/lib/env'

export const prerender = false

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export const GET: APIRoute = async ({ params }) => {
  const category = (params.category || '').replace(/\.xml$/, '')
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')
  const siteName = SITE_NAME || 'Beritana'

  let articles: Article[] = []
  try {
    const res = await apiFetchCached<{ data: Article[] }>(
      `/articles?category=${encodeURIComponent(category)}&limit=200&sort=latest&days=2`,
      120
    )
    articles = res.data || []
  } catch {
    articles = []
  }

  const urls = articles.map((article) => {
    const url = `${siteUrl}/${article.category?.slug || category}/${article.slug}`
    const keywords = article.tags?.map(t => t.name).join(', ') || article.category?.name || ''
    const imageUrl = article.thumbnail_url ? getImageUrl(article.thumbnail_url, { width: 1200 }) : ''

    return `  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteName)}</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      ${keywords ? `<news:keywords>${escapeXml(keywords)}</news:keywords>` : ''}
    </news:news>${imageUrl ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
      <image:caption>${escapeXml(article.thumbnail_alt || article.title)}</image:caption>
    </image:image>` : ''}
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=60',
    },
  })
}
