import type { APIRoute } from 'astro'
import { getSiteConfig } from '@/lib/site-config'
import { API_BASE_URL } from '@/lib/env'
import { jsonResponse } from '@/lib/api-proxy'

export const prerender = false

export const GET: APIRoute = async () => {
  const config = await getSiteConfig()
  const extra = config as unknown as Record<string, unknown>
  const apiBase = (API_BASE_URL || '').replace('/api', '')

  // Sanitize logo URLs — replace localhost with production backend URL
  function sanitizeImageUrl(url: string | undefined | null): string {
    if (!url || typeof url !== 'string' || url.trim() === '') return ''
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
      const path = url.replace(/^https?:\/\/localhost(:\d+)?/, '')
      return apiBase ? `${apiBase}${path}` : ''
    }
    if (url.startsWith('/storage') || url.startsWith('/')) {
      return apiBase ? `${apiBase}${url}` : url
    }
    return url
  }

  return jsonResponse({
    site_name: config.site_name,
    site_logo: sanitizeImageUrl(config.site_logo),
    site_logo_footer: sanitizeImageUrl(config.site_logo_footer),
    menu_items: config.menu_items,
    categories: config.categories,
    header_categories: extra.header_categories || config.categories,
    ads_enabled: (extra.feature_flags as Record<string, boolean> | undefined)?.ads !== false,
    social: {
      facebook: config.facebook_url,
      twitter: config.twitter_url,
      instagram: config.instagram_url,
      youtube: config.youtube_url,
      linkedin: config.linkedin_url,
      tiktok: config.tiktok_url,
    },
  })
}
