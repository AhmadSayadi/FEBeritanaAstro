/**
 * SEO prop builders.
 *
 * These return the flat `SeoProps` shape consumed by
 * `src/components/astro/Seo.astro`. Canonical values are returned as PATHS —
 * `Seo.astro` resolves them against `Astro.site` with `new URL()`, so there is
 * no manual URL string concatenation anywhere (which is what used to produce
 * malformed canonicals like `https://beritana.com//world`).
 */
import { Article } from './types'
import { getSiteConfig } from './site-config'
import { SITE_NAME } from './env'

export interface SeoImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

export interface SeoProps {
  /** Page title; the "%s | SiteName" template is applied. */
  title?: string
  /** og:title / twitter:title when they should differ from `title`. */
  ogTitle?: string
  /** og:description / twitter:description when they differ from `description`. */
  ogDescription?: string
  /** Title used verbatim, bypassing the template (homepage brand title). */
  titleAbsolute?: string
  /** Override the default "%s | SiteName" template. */
  titleTemplate?: string
  description?: string
  /** Path (preferred) or absolute URL. Defaults to the current page URL. */
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  keywords?: string
  authors?: { name: string; url?: string }[]
  image?: SeoImage
  ogType?: 'website' | 'article' | 'profile' | 'video.other'
  locale?: string
  siteName?: string
  article?: {
    publishedTime?: string
    modifiedTime?: string
    section?: string
    tags?: string[]
  }
  twitterCard?: string
  twitterCreator?: string
  rssHref?: string
  /** Suppress the canonical link — for error pages (404/500), which must not
   *  declare themselves as the canonical version of anything. */
  noCanonical?: boolean
}

/** Default homepage/brand title, also the fallback when a page sets none. */
export const DEFAULT_SITE_TITLE =
  'The Voice of Young Indonesian | Berita Anak Muda - Beritana'

const FALLBACK_OG_IMAGE = '/images/og-default.jpg'

/** Normalise a backend image URL into something a social scraper can fetch. */
function safeOgImage(url?: string | null): string {
  if (!url) return FALLBACK_OG_IMAGE
  if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return FALLBACK_OG_IMAGE
  }
  return url
}

export function buildArticleSeo(article: Article): SeoProps {
  const categorySlug = article.category?.slug || 'berita'
  const categoryName = article.category?.name || 'Berita'

  // seo_title (maks 60 char) → fallback ke article.title
  const seoTitle = article.seo_title?.slice(0, 60) || article.title

  // meta_description (maks 160 char) → fallback ke article.description → excerpt
  const metaDesc = (article.meta_description || article.description || article.excerpt || '')
    .slice(0, 160)

  // og:image — prioritas: og_image_path > thumbnail_url > fallback 1200×630
  const ogImageUrl = safeOgImage(article.og_image_path || article.thumbnail_url)

  // dateModified — prioritas: modified_at > updated_at > published_at
  const modifiedTime = article.modified_at || article.updated_at || article.published_at

  return {
    title: seoTitle,
    description: metaDesc,
    keywords: article.tags?.map((t) => t.name).join(', ') || undefined,
    canonical: article.url_canonical
      ? article.url_canonical
      : `/${categorySlug}/${article.slug}`,
    authors: article.author
      ? [{ name: article.author.name, url: `/profile/${article.author.slug}` }]
      : undefined,
    ogType: 'article',
    noindex: article.noindex ?? false,
    image: {
      url: ogImageUrl,
      width: 1200,
      height: 630,
      alt: article.thumbnail_alt || article.title,
    },
    article: {
      publishedTime: article.published_at,
      modifiedTime,
      section: categoryName,
      tags: article.tags?.map((t) => t.name) || [],
    },
  }
}

export function buildCategorySeo(opts: {
  slug: string
  name: string
  description: string
  siteName?: string
}): SeoProps {
  const brand = opts.siteName || SITE_NAME
  return {
    title: opts.name,
    ogTitle: `${opts.name} - ${brand}`,
    description: opts.description,
    canonical: `/${opts.slug}`,
    ogType: 'website',
    image: {
      url: `/kategori/${opts.slug}/opengraph-image.png`,
      width: 1200,
      height: 630,
      alt: opts.name,
    },
  }
}

export async function buildHomeSeo(): Promise<SeoProps> {
  const config = await getSiteConfig()

  // Keep the description in the 150–220 char band for SEO & Discover.
  const DEFAULT_DESCRIPTION =
    'Beritana - The Voice of Young Indonesian. Media berita terupdate khusus anak muda Indonesia. Temukan tren terkini, pop culture, teknologi, hingga isu viral di sini!'
  const rawDesc = config.site_description || DEFAULT_DESCRIPTION
  const description = rawDesc.length < 100 ? DEFAULT_DESCRIPTION : rawDesc

  return {
    // The homepage title is the full brand string — never templated.
    titleAbsolute: DEFAULT_SITE_TITLE,
    description,
    canonical: '/',
    ogType: 'website',
    siteName: config.site_name || SITE_NAME,
    locale: config.site_language || 'id_ID',
    image: {
      url: config.site_thumbnail || FALLBACK_OG_IMAGE,
      width: 1200,
      height: 630,
      alt: config.site_name || SITE_NAME,
    },
  }
}
