/**
 * Web Story (AMP) — Astro endpoint equivalent of Next's stories/[slug]/route.ts.
 * Renders a standalone amp-story HTML document. Returns 404 if no slides.
 */
import type { APIRoute } from 'astro'
import { apiFetchSafe } from '@/lib/api'
import { SITE_URL_RAW, SITE_NAME } from '@/lib/env'

export const prerender = false

interface StorySlide {
  type: 'cover' | 'content' | 'cta'
  image_url: string
  text?: string
  cta_url?: string
  cta_text?: string
}
interface Story {
  id: number
  title: string
  slug: string
  slides: StorySlide[]
  author?: { name: string; avatar_url?: string }
  published_at: string
  category?: { name: string; slug: string }
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '').replace('://www.', '://')
  const siteName = SITE_NAME || 'Beritana'

  const result = await apiFetchSafe<{ data: Story }>(`/stories/${slug}`, 300)
  if (!result?.data || !result.data.slides?.length) {
    return new Response('Not Found', { status: 404 })
  }

  const story = result.data
  const posterImage = story.slides[0]?.image_url || ''

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    url: `${siteUrl}/stories/${slug}`,
    datePublished: story.published_at,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo-beritana.png` },
    },
    image: posterImage,
    author: story.author ? { '@type': 'Person', name: story.author.name } : undefined,
  })

  const escHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const slides = story.slides
    .map((slide, i) => {
      const isLast = slide.type === 'cta'
      const isCover = slide.type === 'cover'
      return `
  <amp-story-page id="page-${i}">
    <amp-story-grid-layer template="fill">
      <amp-img
        src="${escHtml(slide.image_url)}"
        width="720"
        height="1280"
        layout="responsive"
        alt="${escHtml(slide.text || story.title)}"
      ></amp-img>
    </amp-story-grid-layer>
    <amp-story-grid-layer template="vertical-end">
      <div style="background:linear-gradient(transparent,rgba(0,0,0,0.85));padding:${isCover ? '40px 20px' : '20px'};color:white">
        <p style="font-size:${isCover ? '1.6em' : '1.1em'};font-weight:${isCover ? '800' : '600'};margin:0;line-height:1.3">${escHtml(slide.text || '')}</p>
      </div>
    </amp-story-grid-layer>${isLast && slide.cta_url ? `
    <amp-story-cta-layer>
      <a href="${escHtml(slide.cta_url)}" style="color:white;background:#E53935;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:1.1em">
        ${escHtml(slide.cta_text || 'Baca Artikel')}
      </a>
    </amp-story-cta-layer>` : ''}
  </amp-story-page>`
    })
    .join('\n')

  const html = `<!DOCTYPE html>
<html amp lang="id">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <title>${escHtml(story.title)} - ${siteName}</title>
  <link rel="canonical" href="${siteUrl}/stories/${slug}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="Web Story: ${escHtml(story.title)}">
  <script type="application/ld+json">${schema}</script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    amp-story-cta-layer a { display: inline-block; }
  </style>
</head>
<body>
  <amp-story
    standalone
    title="${escHtml(story.title)}"
    publisher="${escHtml(siteName)}"
    publisher-logo-src="${siteUrl}/images/favicon-96x96.png"
    poster-portrait-src="${escHtml(posterImage)}"
  >
${slides}
  </amp-story>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  })
}
