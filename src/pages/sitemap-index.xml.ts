/**
 * Sitemap index — equivalent of Next's src/app/sitemap-index.xml/route.ts.
 * Splits article sitemaps into chunks of 1000 with real per-chunk lastmod.
 */
import type { APIRoute } from 'astro'
import { apiFetchCached } from '@/lib/api'
import { SITE_URL_RAW } from '@/lib/env'

export const prerender = false

const CHUNK_SIZE = 1000

export const GET: APIRoute = async () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')

  let total = 0
  let articles: { updated_at?: string }[] = []
  try {
    const res = await apiFetchCached<{ data: { updated_at?: string }[]; meta?: { total?: number } }>(
      '/sitemap/articles?limit=50000',
      3600
    )
    articles = res.data || []
    total = res.meta?.total || articles.length || 0
  } catch {
    total = 0
  }

  const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE))
  const now = new Date().toISOString()

  const chunkLastmod = (chunkIndex: number): string => {
    const slice = articles.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE)
    let newest = 0
    for (const a of slice) {
      if (!a?.updated_at) continue
      const t = new Date(a.updated_at).getTime()
      if (!Number.isNaN(t) && t > newest) newest = t
    }
    return newest > 0 ? new Date(newest).toISOString() : now
  }

  const sitemaps = [
    `  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    `  <sitemap>
    <loc>${siteUrl}/news-sitemap-index.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    ...Array.from({ length: chunks }, (_, i) =>
      `  <sitemap>
    <loc>${siteUrl}/sitemap-articles/${i + 1}.xml</loc>
    <lastmod>${chunkLastmod(i)}</lastmod>
  </sitemap>`
    ),
  ].join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
