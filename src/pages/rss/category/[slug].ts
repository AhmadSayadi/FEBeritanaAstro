/**
 * Per-category RSS 2.0 feed — equivalent of Next's rss/category/[slug]/route.ts.
 * URL: /rss/category/{slug}. Includes content:encoded, media:content, dc:creator.
 */
import type { APIRoute } from 'astro'
import { apiFetchCached, getImageUrl } from '@/lib/api'
import type { Article } from '@/lib/types'
import { SITE_URL_RAW, SITE_NAME } from '@/lib/env'

export const prerender = false

interface CategoryFeedResponse {
  data: Article[]
  category?: { name?: string; slug?: string; description?: string }
}

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export const GET: APIRoute = async ({ params }) => {
  const slug = (params.slug || '').replace(/\.xml$/, '')
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')
  const siteName = SITE_NAME || 'Beritana'

  let articles: Article[] = []
  let categoryName = slug
  try {
    const res = await apiFetchCached<CategoryFeedResponse>(
      `/articles?category=${encodeURIComponent(slug)}&limit=30&sort=latest`,
      300
    )
    articles = res.data || []
    if (res.category?.name) categoryName = res.category.name
  } catch {
    // Return empty feed on error
  }

  const feedUrl = `${siteUrl}/rss/category/${slug}`
  const categoryUrl = `${siteUrl}/${slug}`

  const items = articles.map((article) => {
    const url = `${siteUrl}/${article.category?.slug || slug}/${article.slug}`
    const imageUrl = getImageUrl(article.thumbnail_url, { width: 1200 })
    const keywords = article.tags?.map((t) => t.name).join(', ') || ''
    const fullContent = article.content || article.excerpt || ''

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description><![CDATA[ ${article.excerpt || ''} ]]></description>
      <content:encoded><![CDATA[ ${fullContent} ]]></content:encoded>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      <category>${escapeXml(article.category?.name || categoryName)}</category>
      ${article.author ? `<dc:creator>${escapeXml(article.author.name)}</dc:creator>` : ''}
      ${imageUrl ? `<media:content url="${escapeXml(imageUrl)}" medium="image" type="image/webp" width="1200" height="674">
        <media:title type="plain">${escapeXml(article.thumbnail_alt || article.title)}</media:title>
      </media:content>` : ''}
      ${keywords ? `<media:keywords>${escapeXml(keywords)}</media:keywords>` : ''}
    </item>`
  }).join('\n')

  const lastBuild = articles[0]?.published_at
    ? new Date(articles[0].published_at).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} &amp; ${escapeXml(categoryName)}</title>
    <link>${escapeXml(categoryUrl)}</link>
    <description>${escapeXml(`Berita terbaru kategori ${categoryName} dari ${siteName}`)}</description>
    <language>id</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
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
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=120',
    },
  })
}
