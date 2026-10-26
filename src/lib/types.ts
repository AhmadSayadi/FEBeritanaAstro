/**
 * TypeScript interfaces aligned with API-CONTRACT.md
 *
 * Field marked optional (`?`) is either:
 *  - Available only on detail endpoint (not list)
 *  - Returned only when user is authenticated
 *  - Optional/null in some contexts (e.g., draft articles)
 */

// ───────────────── Article ─────────────────

export interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  content?: string // only on detail endpoint
  description?: string // meta description for SEO
  thumbnail_url: string
  thumbnail_alt?: string
  thumbnail_blur?: string // base64 blur placeholder
  thumbnail_credit?: string // image attribution/credit (e.g. "Foto: John Doe / Pixabay")
  published_at: string
  updated_at: string
  reading_time?: number

  // Stats (returned by list & detail)
  views?: number
  likes_count?: number
  comments_count?: number
  shares_count?: number

  // Flags
  is_featured?: boolean
  is_breaking?: boolean

  // User-specific (only when logged in)
  is_liked?: boolean
  is_bookmarked?: boolean
  user_reaction?: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | null

  // Relations
  author: Author | null
  editor?: Author | null  // Editor yang menyunting artikel (optional)
  category: Category
  tags?: Tag[]

  // FAQ for FAQPage schema (optional, from BE)
  faqs?: { question: string; answer: string }[]

  // AI disclosure (optional, from BE)
  is_ai_assisted?: boolean
  ai_disclosure_text?: string

  // SEO
  url_canonical?: string
}

// ───────────────── Author ─────────────────

export interface Author {
  id?: number
  name: string
  slug: string
  avatar_url: string
  bio?: string
  cover_url?: string
  cover_color?: string
  role?: string // e.g. "Senior Editor", "Reporter"
  verified?: boolean
  location?: string
  joined_at?: string
}

export interface AuthorSocial {
  twitter?: string
  instagram?: string
  linkedin?: string
  facebook?: string
  website?: string
  email?: string
}

export interface AuthorStats {
  total_articles: number
  total_views: number
  total_likes: number
  total_comments?: number
  rating?: number
}

export interface AuthorDetail extends Author {
  social?: AuthorSocial
  stats?: AuthorStats
  joined_year?: number
  last_active_at?: string
}

// ───────────────── Category ─────────────────

export interface Category {
  id?: number
  name: string
  slug: string
  color?: string // hex color for badge (light mode)
  color_dark?: string // hex color for dark mode (optional)
  icon?: string // icon name (lucide-react) or svg path
  description?: string
  meta_description?: string
  order?: number
  article_count?: number
  updated_at?: string
}

// ───────────────── Tag ─────────────────

export interface Tag {
  id?: number
  name: string
  slug: string
}

// ───────────────── Comment ─────────────────

export interface Comment {
  id: number
  user: {
    id: number
    name: string
    avatar_url: string
  }
  content: string
  likes_count: number
  is_liked: boolean
  created_at: string
  replies_count?: number
  replies?: Comment[]
  parent_id?: number | null
}

// ───────────────── Misc ─────────────────

export interface Video {
  id: number
  title: string
  slug: string
  thumbnail_url: string
  video_url?: string
  video_embed_url?: string
  duration: string
  duration_seconds?: number
  views?: number
  source?: string
  source_verified?: boolean
  category?: Pick<Category, 'name' | 'slug'>
  published_at: string
}

export interface Ekoran {
  id: number
  title: string
  slug: string
  cover_url: string
  pdf_url: string
  date: string
  page_count?: number
  views?: number
  is_featured?: boolean
}

export interface PhotoNews {
  id: number
  title: string
  slug: string
  thumbnail_url: string
  thumbnail_alt?: string
  category: Pick<Category, 'name' | 'slug' | 'color'>
  views?: number
  views_formatted?: string
  published_at: string
  url?: string
}

export interface BreakingNews {
  id: number
  title: string
  slug: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  published_at: string
  expires_at?: string
}

// ───────────────── Pagination ─────────────────

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ───────────────── Sitemap ─────────────────

export interface SitemapArticle {
  id: number
  title?: string
  slug: string
  category_slug?: string
  // BE mungkin mengirim slug kategori dalam bentuk berbeda; semua ditoleransi.
  category?: { slug?: string } | string
  categorySlug?: string
  thumbnail_url?: string
  updated_at: string
}

// ───────────────── Traktir Kopi ─────────────────

/**
 * Penyedia metode pembayaran untuk fitur Traktir Kopi.
 * Fase saat ini: 'static_qris' (gambar QRIS statis).
 * Masa depan: 'duitku' (payment gateway dinamis).
 */
export type PaymentProvider = 'static_qris' | 'duitku'

/** Satu opsi donasi berbasis "gelas kopi". */
export interface CoffeeOption {
  cups: number // jumlah gelas (mis. 1, 3, 5)
  amount: number // nominal rupiah untuk opsi tsb (mis. 10000, 30000)
}

/**
 * Konfigurasi fitur Traktir Kopi — bagian dari SiteConfig (sumber: /api/settings).
 * Dikelola dari admin panel Laravel.
 */
export interface TraktirConfig {
  active: boolean
  payment_provider: PaymentProvider
  qris_image_url: string | null // URL/path gambar QRIS statis
  coffee_options: CoffeeOption[]
}

/**
 * Konteks donasi yang dibawa lintas alur (modal → login → pembayaran).
 * Diserialkan ke query param pada return URL sehingga tahan terhadap redirect login.
 */
export interface DonationContext {
  articleSlug: string
  articleTitle: string
  authorSlug: string
  authorName: string
  cups: number
  amount: number
}
