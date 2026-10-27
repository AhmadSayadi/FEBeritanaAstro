/**
 * Site Configuration — fetched from backend
 * All settings can be managed from Laravel admin panel
 */

import type { TraktirConfig } from './types'
import { env } from './env'

export interface MenuItem {
  name: string
  slug: string
  icon?: string
  color?: string
  order: number
}

export interface CategoryNav {
  name: string
  slug: string
  order: number
  color?: string // header accent color (hex or tailwind class)
}

export interface HomepageSection {
  id: string
  name: string
  active: boolean
  order: number
}

export interface SiteConfig {
  // Basic / Branding
  site_name: string
  site_title: string
  site_description: string
  site_keywords: string
  site_url: string
  site_email: string
  site_language: string

  // Images / Branding
  site_logo: string
  site_logo_footer: string
  site_thumbnail: string       // Thumbnail Home / OG image
  site_favicon: string

  // SEO & Verification
  google_verification: string
  bing_verification: string
  yandex_verification: string
  pinterest_verification: string

  // Analytics
  gtm_id: string
  ga_id: string
  adsense_id: string

  // Social
  facebook_url: string
  twitter_url: string
  youtube_url: string
  instagram_url: string
  linkedin_url: string
  tiktok_url: string

  // Footer
  footer_description: string
  footer_copyright: string

  // Contact
  contact_email: string
  contact_phone: string
  contact_address: string

  // Legal
  terms_url: string
  privacy_url: string

  // Publisher (for Google News)
  publisher_name: string
  publisher_logo: string

  // Navigation — managed from backend
  menu_items: MenuItem[]
  categories: CategoryNav[]

  // Homepage sections — toggle active/inactive + order
  homepage_sections: HomepageSection[]

  // Section limits
  limit_video_story: number
  limit_ekoran: number
  limit_foto: number
  limit_category_main: number
  limit_category_small: number
  limit_berita_terbaru: number
  limit_exclusive: number
  limit_slider: number
  limit_latest_news: number
  limit_explore: number

  // Traktir Kopi — fitur donasi/tip ke penulis (dikelola admin)
  traktir_kopi: TraktirConfig
}

const CACHE_DURATION = 1 * 60 * 1000 // 1 minute (was 10)

let cachedConfig: SiteConfig | null = null
let cacheTime = 0

// Default config — used when backend is unavailable
const defaultConfig: SiteConfig = {
  site_name: process.env.PUBLIC_SITE_NAME || 'Beritana',
  site_title: 'Beritana - The Voice of Young Indonesian',
  site_description: 'Berita terbaru untuk anak muda seputar teknologi, politik, dan infografis menarik yang disajikan secara asik dan informatif. Tetap update dengan tren terkini dan informasi penting yang relevan bagi generasi muda.',
  site_keywords: 'berita anak muda, berita terkini, berita viral, informasi terbaru, gaya hidup',
  site_url: process.env.PUBLIC_SITE_URL || 'https://beritana.com',
  site_email: 'beritananews@gmail.com',
  site_language: 'id_ID',

  site_logo: 'https://cdn.beritana.com/logo/logo.webp',
  site_logo_footer: 'https://cdn.beritana.com/logo/logo.webp',
  site_thumbnail: '/images/thumbnail_home.png',
  site_favicon: '/images/favicon.png',

  google_verification: '',
  bing_verification: '',
  yandex_verification: '',
  pinterest_verification: '',

  gtm_id: process.env.PUBLIC_GTM_ID || '',
  ga_id: '',
  adsense_id: process.env.PUBLIC_ADSENSE_ID || '',

  facebook_url: 'https://facebook.com/beritana',
  twitter_url: 'https://twitter.com/beritana',
  youtube_url: 'https://youtube.com/beritana',
  instagram_url: '',
  linkedin_url: 'https://linkedin.com/company/beritana',
  tiktok_url: '',

  footer_description: 'Portal berita Indonesia terpercaya yang menyajikan informasi akurat dan berimbang.',
  footer_copyright: `© ${new Date().getFullYear()} beritana. All rights reserved.`,

  contact_email: 'beritananews@gmail.com',
  contact_phone: '',
  contact_address: 'Jl. Pesona Alam, Gunung Anyar, Surabaya, Jawa Timur, Indonesia',

  terms_url: '/pages/privacy-policy',
  privacy_url: '/pages/privacy-policy',

  publisher_name: 'beritana',
  publisher_logo: '/images/logo-beritana.png',

  menu_items: [
    { name: 'Home', slug: '/', icon: 'home', color: '#ffffff', order: 1 },
    { name: 'Kanal', slug: '#', icon: 'kanal', color: '#ffffff', order: 2 },
    { name: 'Fokus', slug: '#', icon: 'fokus', color: '#ffffff', order: 3 },
    { name: 'Ekoran', slug: '#', icon: 'ekoran', color: '#ffffff', order: 4 },
    { name: 'Foto', slug: '/kategori/foto', icon: 'foto', color: '#ffffff', order: 5 },
  ],

  categories: [
    { name: 'Nasional', slug: 'nasional', order: 1, color: '#DC2626' },
    { name: 'Politik', slug: 'politik', order: 2, color: '#2563EB' },
    { name: 'Olahraga', slug: 'olahraga', order: 3, color: '#16A34A' },
  ],

  homepage_sections: [
    { id: 'hero_slider', name: 'Hero Slider + Berita Terbaru', active: true, order: 1 },
    { id: 'category_columns', name: 'Kategori (Olahraga/Politik/Hiburan)', active: true, order: 2 },
    { id: 'video_story', name: 'Video Story', active: true, order: 3 },
    { id: 'banner_exclusive', name: 'Banner Berita Eksklusif', active: true, order: 4 },
    { id: 'ekoran', name:   'e-Koran', active: true, order: 5 },
    { id: 'photo_news', name: 'Beritana Foto', active: true, order: 6 },
    { id: 'explore_news', name: 'Berita Terbaru (Auto Load)', active: true, order: 7 },
  ],

  limit_video_story: 8,
  limit_ekoran: 6,
  limit_foto: 5,
  limit_category_main: 1,
  limit_category_small: 2,
  limit_berita_terbaru: 5,
  limit_exclusive: 3,
  limit_slider: 5,
  limit_latest_news: 4,
  limit_explore: 15,

  // Default: fitur NONAKTIF bila backend tak mengirim data traktir_kopi
  traktir_kopi: {
    active: false,
    payment_provider: 'static_qris',
    qris_image_url: null,
    coffee_options: [],
  },
}

/**
 * Fetch site config from backend
 * Endpoint: GET /api/settings
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedConfig
  }

  // Skip fetch if no real API configured
  const apiUrl = env('API_BASE_URL')
  const apiKey = env('API_SECRET_KEY', '')
  if (!apiUrl) {
    return defaultConfig
  }

  try {
    // Freshness is handled by the module-level memo above (cachedConfig +
    // CACHE_DURATION). The old Next `next: { revalidate }` option is a no-op
    // under Node/Workers fetch, so it's removed.
    const res = await fetch(`${apiUrl}/settings`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey,
      },
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) throw new Error('Failed')

    const data = await res.json()
    const config: SiteConfig = { ...defaultConfig, ...data.data }
    if (data.data?.menu_items?.length) config.menu_items = data.data.menu_items
    if (data.data?.categories?.length) config.categories = data.data.categories
    if (data.data?.homepage_sections?.length) config.homepage_sections = data.data.homepage_sections
    // Merge traktir_kopi atas default (jaga field yang tak dikirim backend)
    if (data.data?.traktir_kopi) {
      config.traktir_kopi = { ...defaultConfig.traktir_kopi, ...data.data.traktir_kopi }
    }

    cachedConfig = config
    cacheTime = Date.now()
    return config
  } catch {
    return defaultConfig
  }
}

export function getDefaultConfig(): SiteConfig {
  return cachedConfig || defaultConfig
}
