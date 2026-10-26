/**
 * News sitemap index — equivalent of Next's news-sitemap-index.xml/route.ts.
 * Registers the combined news sitemap + per-category sitemaps for categories
 * that actually have articles in the last 48h (crawl-budget friendly).
 */
import type { APIRoute } from 'astro'
import { apiFetchCached } from '@/lib/api'
import type { Article } from '@/lib/types'
import { SITE_URL_RAW } from '@/lib/env'

export const prerender = false

export const GET: APIRoute = async () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')
  const now = new Date().toISOString()

  let articles: Article[] = []
  try {
    const res = await apiFetchCached<{ data: Article[] }>('/articles?limit=500&sort=latest&days=2', 300)
    articles = res.data || []
  } catch {
    articles = []
  }

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

  const catMap = new Map<string, string>()
  for (const a of articles) {
    const slug = a.category?.slug
    if (!slug) continue
    const published = a.published_at ? new Date(a.published_at).toISOString() : now
    const existing = catMap.get(slug)
    if (!existing || published > existing) catMap.set(slug, published)
  }

  const entries = Array.from(catMap.entries())
    .map(([slug, lastmod]) => `  <sitemap>
    <loc>${escapeXml(`${siteUrl}/news-sitemap/${slug}.xml`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`)
    .join('\n')

  const combined = `  <sitemap>
    <loc>${siteUrl}/news-sitemap.xml</loc>
    <lastmod>${articles[0]?.published_at ? new Date(articles[0].published_at).toISOString() : now}</lastmod>
  </sitemap>`

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${combined}${entries ? '\n' + entries : ''}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
