import { Article } from './types'
import { getDefaultConfig } from './site-config'
import { getImageUrl } from './api'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://beritana.com').replace(/\/$/, '').replace('://www.', '://')
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Beritana'

// Batas maksimal panjang articleBody dalam JSON-LD.
// Konten penuh dimasukkan supaya Google bisa mengklasifikasikan artikel (Top Stories),
// tapi dibatasi agar ukuran HTML tidak membengkak & mengganggu LCP.
const MAX_ARTICLE_BODY_CHARS = 5000

export function buildNewsArticleSchema(article: Article) {
  // PENTING (SEO): category bisa null (kategori dihapus / BE tak mengirim).
  // Akses langsung article.category.slug dulu melempar TypeError saat SSR →
  // halaman artikel gagal render → CANONICAL HILANG → Google melaporkan
  // "Duplicate without user-selected canonical". Guard dengan fallback 'berita'.
  const categorySlug = article.category?.slug || 'berita'
  const categoryName = article.category?.name || 'Berita'

  // Calculate word count from content (strip HTML)
  const plainText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = plainText ? plainText.split(' ').length : undefined
  const readingTime = article.reading_time || (wordCount ? Math.ceil(wordCount / 200) : undefined)

  // articleBody — full plain-text content untuk sinyal berita Google.
  // Dipotong di batas kata agar tidak terputus di tengah kata.
  let articleBody: string | undefined
  if (plainText) {
    if (plainText.length <= MAX_ARTICLE_BODY_CHARS) {
      articleBody = plainText
    } else {
      const truncated = plainText.slice(0, MAX_ARTICLE_BODY_CHARS)
      const lastSpace = truncated.lastIndexOf(' ')
      articleBody = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…'
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${SITE_URL}/${categorySlug}/${article.slug}#article`,
    headline: article.title.slice(0, 110),
    description: article.excerpt,
    datePublished: article.published_at,
    // dateModified wajib ada untuk Google News — fallback ke published_at bila BE tak kirim
    dateModified: article.updated_at || article.published_at,
    url: `${SITE_URL}/${categorySlug}/${article.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/${categorySlug}/${article.slug}`,
    },
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    author: article.author ? {
      '@type': 'Person',
      name: article.author.name,
      url: `${SITE_URL}/profile/${article.author.slug}`,
    } : undefined,
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    image: {
      '@type': 'ImageObject',
      // Absolute CDN URL — required for Google Discover / Top Stories
      url: getImageUrl(article.thumbnail_url, { width: 1200 }),
      width: 1200,
      height: 630,
      caption: article.thumbnail_alt || article.title,
      creditText: article.thumbnail_credit || SITE_NAME,
      creator: {
        '@type': 'Organization',
        name: article.thumbnail_credit || SITE_NAME,
      },
      copyrightNotice: `© ${new Date(article.published_at).getFullYear()} ${SITE_NAME}`,
      license: `${SITE_URL}/pages/privacy-policy`,
      acquireLicensePage: `${SITE_URL}/pages/contact`,
    },
    articleSection: categoryName,
    keywords: article.tags?.map(t => t.name).join(', ') || '',
    articleBody: articleBody,
    wordCount: wordCount,
    timeRequired: readingTime ? `PT${readingTime}M` : undefined,
    inLanguage: 'id',
    isAccessibleForFree: true,
    // Speakable — for Google Assistant voice reading (matches TTS feature)
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.prose'],
    },
  }
}

// FAQ schema — only render if article has FAQs from BE
export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'id',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/pencarian?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildOrganizationSchema() {
  const config = getDefaultConfig()
  const sameAs = [
    config.facebook_url,
    config.twitter_url,
    config.instagram_url,
    config.youtube_url,
    config.linkedin_url,
    config.tiktok_url,
  ].filter(url => url && url.trim() !== '' && url !== '#')

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/images/logo-beritana.png`,
      width: 300,
      height: 60,
    },
    sameAs,
    description: 'Portal berita terpercaya Indonesia yang menyajikan informasi aktual, berimbang, dan mendalam dari berbagai kategori untuk generasi muda.',
    foundingDate: '2016',
    publishingPrinciples: `${SITE_URL}/pages/pedoman-media-siber`,
    ethicsPolicy: `${SITE_URL}/pages/pedoman-media-siber`,
    correctionsPolicy: `${SITE_URL}/pages/pedoman-media-siber`,
    masthead: `${SITE_URL}/pages/redaksi`,
    actionableFeedbackPolicy: `${SITE_URL}/pages/contact`,
    diversityPolicy: `${SITE_URL}/pages/pedoman-media-siber`,
    noBylinesPolicy: `${SITE_URL}/pages/pedoman-media-siber`,
    // Agentic/GEO — help AI engines verify authority
    knowsAbout: [
      'Berita Indonesia',
      'Jurnalisme Digital',
      'Politik Indonesia',
      'Teknologi',
      'Olahraga',
      'Hiburan',
      'Ekonomi',
      'Gaya Hidup',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    inLanguage: 'id',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Redaksi',
      email: config.contact_email || 'beritananews@gmail.com',
      url: `${SITE_URL}/pages/contact`,
    },
    // Alamat fisik — sinyal Trust (E-E-A-T) untuk Google News
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.contact_address || 'Jl. Pesona Alam, Gunung Anyar',
      addressLocality: 'Surabaya',
      addressRegion: 'Jawa Timur',
      addressCountry: 'ID',
    },
  }
}

// ItemList for homepage — list of top articles (Top Stories carousel signal)
export function buildItemListSchema(articles: { title: string; slug: string; category?: { slug: string } | null }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: articles.slice(0, 10).map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/${article.category?.slug || 'berita'}/${article.slug}`,
      name: article.title,
    })),
  }
}

// CollectionPage for category/tag pages
export function buildCollectionPageSchema(opts: {
  name: string
  description?: string
  url: string
  articles: { title: string; slug: string; category?: { slug: string } | null }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'id',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.articles.slice(0, 10).map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/${article.category?.slug || 'berita'}/${article.slug}`,
        name: article.title,
      })),
    },
  }
}

interface PersonSchemaInput {
  name: string
  slug: string
  bio?: string
  avatar_url?: string
  role?: string
  email?: string
  social?: Record<string, string | undefined>
  joined_at?: string
}

export function buildPersonSchema(author: PersonSchemaInput) {
  const sameAs = Object.entries(author.social || {})
    .filter(([k, v]) => k !== 'email' && typeof v === 'string' && v && v !== '#')
    .map(([, v]) => v)

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: `${SITE_URL}/profile/${author.slug}`,
    description: author.bio,
    image: author.avatar_url,
    jobTitle: author.role || 'Jurnalis',
    email: author.email || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    worksFor: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    // GEO — helps AI identify expertise and authority
    knowsAbout: 'Jurnalistik, Berita Indonesia, Media Digital',
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Jurnalis Terverifikasi',
    },
    memberOf: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
    },
  }
}
