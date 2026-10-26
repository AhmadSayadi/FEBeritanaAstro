/**
 * robots.txt — Astro endpoint equivalent of Next's src/app/robots.ts.
 * Same rules, AI-crawler allowances, and sitemap references.
 */
import type { APIRoute } from 'astro'
import { SITE_URL_RAW } from '@/lib/env'

export const prerender = false

export const GET: APIRoute = () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Allow: /_astro/',
    'Allow: /_image',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /profil/',
    'Disallow: /tulis/',
    '',
    'User-agent: Googlebot-News',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /profil/',
    'Disallow: /tulis/',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /profil/',
    'Disallow: /tulis/',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /profil/',
    'Disallow: /tulis/',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /profil/',
    'Disallow: /tulis/',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Sitemap: ${siteUrl}/news-sitemap-index.xml`,
    `Sitemap: ${siteUrl}/news-sitemap.xml`,
    `Sitemap: ${siteUrl}/video-sitemap.xml`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
