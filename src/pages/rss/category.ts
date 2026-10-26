/**
 * OPML of all per-category RSS feeds — equivalent of Next's rss/category/route.ts.
 * URL: /rss/category
 */
import type { APIRoute } from 'astro'
import { fetchCategories } from '@/lib/data'
import { SITE_URL_RAW, SITE_NAME } from '@/lib/env'

export const prerender = false

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export const GET: APIRoute = async () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')
  const siteName = SITE_NAME || 'Beritana'

  const categories = await fetchCategories()

  const outlines = [
    `    <outline type="rss" text="${escapeXml(`${siteName} — Semua Berita`)}" title="${escapeXml(`${siteName} — Semua Berita`)}" xmlUrl="${siteUrl}/feed.xml" htmlUrl="${siteUrl}" />`,
    ...categories
      .filter((c) => c.slug)
      .map((c) => {
        const feedUrl = `${siteUrl}/rss/category/${c.slug}`
        const htmlUrl = `${siteUrl}/${c.slug}`
        const label = `${siteName} — ${c.name}`
        return `    <outline type="rss" text="${escapeXml(label)}" title="${escapeXml(label)}" xmlUrl="${escapeXml(feedUrl)}" htmlUrl="${escapeXml(htmlUrl)}" />`
      }),
  ].join('\n')

  const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(`${siteName} — RSS Feeds`)}</title>
    <ownerName>${escapeXml(siteName)}</ownerName>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`

  return new Response(opml, {
    headers: {
      'Content-Type': 'text/x-opml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
    },
  })
}
