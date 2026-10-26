/**
 * Main sitemap — Astro endpoint equivalent of Next's src/app/sitemap.ts.
 * Homepage + key static pages + categories + all articles (with image ext).
 */
import type { APIRoute } from 'astro'
import { apiFetchCached, getImageUrl } from '@/lib/api'
import type { Category, SitemapArticle } from '@/lib/types'
import { SITE_URL_RAW } from '@/lib/env'

export const prerender = false

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export const GET: APIRoute = async () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')

  let articles: SitemapArticle[] = []
  let categories: Category[] = []
  try {
    const [articlesRes, categoriesRes] = await Promise.all([
      apiFetchCached<{ data: SitemapArticle[] }>('/sitemap/articles', 3600),
      apiFetchCached<{ data: Category[] }>('/categories', 3600),
    ])
    articles = articlesRes.data
    categories = categoriesRes.data
  } catch {
    // Minimal sitemap if API unavailable
  }

  const now = new Date().toISOString()

  const staticEntries: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: siteUrl, lastmod: now, changefreq: 'hourly', priority: '1.0' },
    { loc: `${siteUrl}/video`, lastmod: now, changefreq: 'daily', priority: '0.7' },
    { loc: `${siteUrl}/foto`, lastmod: now, changefreq: 'daily', priority: '0.7' },
    { loc: `${siteUrl}/infografis`, lastmod: now, changefreq: 'daily', priority: '0.7' },
    { loc: `${siteUrl}/ekoran`, lastmod: now, changefreq: 'daily', priority: '0.6' },
    { loc: `${siteUrl}/rss-feeds`, lastmod: now, changefreq: 'monthly', priority: '0.3' },
    { loc: `${siteUrl}/pages/tentang-kami`, lastmod: now, changefreq: 'monthly', priority: '0.4' },
    { loc: `${siteUrl}/pages/redaksi`, lastmod: now, changefreq: 'monthly', priority: '0.4' },
    { loc: `${siteUrl}/pages/pedoman-media-siber`, lastmod: now, changefreq: 'monthly', priority: '0.4' },
    { loc: `${siteUrl}/pages/privacy-policy`, lastmod: now, changefreq: 'monthly', priority: '0.3' },
    { loc: `${siteUrl}/pages/contact`, lastmod: now, changefreq: 'monthly', priority: '0.4' },
  ]

  const staticXml = staticEntries
    .map((e) => `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`)
    .join('\n')

  const categoryXml = categories
    .map((c) => {
      const lastmod = c.updated_at ? new Date(c.updated_at).toISOString() : now
      return `  <url>\n    <loc>${escapeXml(`${siteUrl}/${c.slug}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
    })
    .join('\n')

  const articleXml = articles
    .map((a) => {
      const imageUrl = a.thumbnail_url ? getImageUrl(a.thumbnail_url, { width: 1200 }) : ''
      return `  <url>\n    <loc>${escapeXml(`${siteUrl}/${a.category_slug || 'berita'}/${a.slug}`)}</loc>\n    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>${imageUrl ? `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n    </image:image>` : ''}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[staticXml, categoryXml, articleXml].filter(Boolean).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
