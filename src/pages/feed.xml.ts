/**
 * Main RSS feed — Astro endpoint equivalent of Next's src/app/feed.xml/route.ts.
 */
import type { APIRoute } from 'astro'
import { apiFetchCached, getImageUrl } from '@/lib/api'
import type { Article } from '@/lib/types'
import { SITE_URL_RAW, SITE_NAME } from '@/lib/env'

export const prerender = false

export const GET: APIRoute = async () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')
  const siteName = SITE_NAME || 'Beritana'

  let articles: Article[] = []
  try {
    const res = await apiFetchCached<{ data: Article[] }>('/articles?limit=30&sort=latest', 300)
    articles = res.data || []
  } catch {
    // Return empty feed
  }

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const items = articles.map((article) => {
    const url = `${siteUrl}/${article.category?.slug || 'berita'}/${article.slug}`
    const imageUrl = getImageUrl(article.thumbnail_url, { width: 1200 })

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.excerpt || '')}</description>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      <category>${escapeXml(article.category?.name || '')}</category>
      ${article.author ? `<dc:creator>${escapeXml(article.author.name)}</dc:creator>` : ''}
      ${imageUrl ? `<media:content url="${escapeXml(imageUrl)}" medium="image" />` : ''}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>Berita terbaru dari ${escapeXml(siteName)}</description>
    <language>id</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
    <image>
      <url>${siteUrl}/images/logo-beritana.png</url>
      <title>${escapeXml(siteName)}</title>
      <link>${siteUrl}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
