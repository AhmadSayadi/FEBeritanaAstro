/**
 * Data layer — fetches news content from the Laravel backend API.
 *
 * Caching is handled by `apiFetchCached` in ./api (in-process stale-while-
 * revalidate keyed by URL), with the per-route CDN `s-maxage` headers from
 * middleware.ts layered on top. Each function below passes its own revalidate
 * TTL. On failure, list fetches degrade to empty/null so a page still renders.
 */

import { apiFetchCached, apiFetchSafe, getImageUrl } from './api'
import { Article, Category, PaginatedResponse } from './types'

// ─── Homepage ────────────────────────────────────────────────

export interface HomepageData {
  slider: Article[]
  latest_news: Article[]
  category_columns: {
    category: Category
    articles: Article[]
  }[]
  video_story: Article[]
  banner_exclusive: Article[]
  ekoran: {
    id: number
    title: string
    slug: string
    cover_url: string
    pdf_url?: string
    date: string
    page_count?: number
    views?: number
    is_featured?: boolean
  }[]
  ekoran_background_url?: string
  ekoran_background_color?: string
  photo_news: Article[]
  explore: Article[]
  popular: Article[]
  recommended?: Article[]
  breaking: { id: number; title: string; slug: string; priority: string }[]
}

interface HomepageAPIResponse {
  data: {
    slider: Article[]
    latest_news: Article[]
    category_columns: {
      category: Category
      articles: Article[]
    }[]
    video_story: Article[]
    banner_exclusive: Article[]
    ekoran: {
      id: number
      title: string
      slug: string
      cover_url: string
      pdf_url?: string
      date: string
      page_count?: number
      views?: number
      is_featured?: boolean
    }[]
    ekoran_background_url?: string
    ekoran_background_color?: string
    photo_news: Article[]
    explore: Article[]
    popular: Article[]
    breaking: { id: number; title: string; slug: string; priority: string }[]
  }
}

export async function fetchHomepage(): Promise<HomepageData | null> {
  // Try up to 2 times with longer timeout
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await apiFetchCached<HomepageAPIResponse>('/homepage', 60)
      return res.data
    } catch (e) {
      if (attempt === 0) {
        // Wait 500ms before retry
        await new Promise(r => setTimeout(r, 500))
        continue
      }
      console.error('[data] fetchHomepage failed after retry:', e)
      return null
    }
  }
  return null
}

// ─── Article Detail ──────────────────────────────────────────

export interface ArticleFullResponse {
  article: Article
  related: Article[]
  popular: Article[]
  latest: Article[]
}

export async function fetchArticleFull(slug: string): Promise<ArticleFullResponse | null> {
  try {
    const res = await apiFetchCached<ArticleFullResponse>(`/articles/${slug}/full`, 300)
    return res
  } catch {
    return null
  }
}

export async function fetchArticleDetail(slug: string): Promise<Article | null> {
  try {
    const res = await apiFetchCached<{ data: Article }>(`/articles/${slug}`, 300)
    return res.data
  } catch {
    return null
  }
}

// ─── Articles List ───────────────────────────────────────────

interface ArticleListParams {
  page?: number
  limit?: number
  category?: string
  tag?: string
  author?: string
  sort?: string
  featured?: boolean
}

export async function fetchArticles(params: ArticleListParams = {}): Promise<PaginatedResponse<Article>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.category) searchParams.set('category', params.category)
  if (params.tag) searchParams.set('tag', params.tag)
  if (params.author) searchParams.set('author', params.author)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.featured) searchParams.set('featured', '1')

  const query = searchParams.toString()
  const path = `/articles${query ? `?${query}` : ''}`

  try {
    return await apiFetchCached<PaginatedResponse<Article>>(path, 60)
  } catch {
    return { data: [], meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 } }
  }
}

// ─── Categories ──────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await apiFetchCached<{ data: Category[] }>('/categories', 600)
    return res.data
  } catch {
    return []
  }
}

interface CategoryPageResponse {
  category: Category
  data: Article[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function fetchCategoryArticles(slug: string, page: number = 1, limit: number = 12): Promise<CategoryPageResponse | null> {
  try {
    return await apiFetchCached<CategoryPageResponse>(`/categories/${slug}?page=${page}&limit=${limit}`, 60)
  } catch {
    return null
  }
}

// ─── Tags ────────────────────────────────────────────────────

interface TagPageResponse {
  tag: { name: string; slug: string }
  data: Article[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * Hasil fetch tag yang membedakan "tag tidak ada" dari "backend gagal".
 * Penting untuk SEO: noindex hanya boleh diberikan saat jumlah artikel benar-benar
 * diketahui, bukan saat request timeout/5xx.
 */
export type TagFetchResult =
  | { status: 'ok'; data: TagPageResponse }
  | { status: 'not_found' }
  | { status: 'error' }

export async function fetchTagArticlesResult(slug: string, page: number = 1): Promise<TagFetchResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await apiFetchCached<TagPageResponse>(`/tags/${slug}?page=${page}`, 60)
      return { status: 'ok', data }
    } catch (e) {
      // apiFetchCached melempar "API Error {status}: ..." untuk respons non-OK.
      // 404 = tag memang tidak ada → tidak perlu retry.
      if (e instanceof Error && /^API Error 404\b/.test(e.message)) {
        return { status: 'not_found' }
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 300))
    }
  }
  return { status: 'error' }
}

export async function fetchTagArticles(slug: string, page: number = 1): Promise<TagPageResponse | null> {
  const result = await fetchTagArticlesResult(slug, page)
  return result.status === 'ok' ? result.data : null
}

// ─── Authors ─────────────────────────────────────────────────

export async function fetchAuthorProfile(slug: string) {
  return apiFetchSafe<{
    data: {
      id: number
      name: string
      slug: string
      avatar_url: string
      cover_url: string
      cover_color: string
      bio: string
      role: string
      verified: boolean
      location: string
      joined_at: string
      social: Record<string, string>
      stats: {
        total_articles: number
        total_likes: number
        total_comments: number
        total_views: number
        rating: number
      }
      gamification?: {
        total_points: number
        level: { number: number; name: string; badge_name: string; badge_color: string }
        next_level: { progress: number }
        reputation_score: number
        streak: { daily: number; longest: number }
        stats: { articles: number; views: number; trending: number }
        badges: { name: string; color: string }[]
        leaderboard_rank: number
      }
    }
    articles: PaginatedResponse<Article>
  }>(`/authors/${slug}`, 120)
}

// ─── Search ──────────────────────────────────────────────────

export async function fetchSearch(q: string, page: number = 1, category?: string) {
  const params = new URLSearchParams({ q, page: String(page), limit: '12' })
  if (category) params.set('category', category)

  return apiFetchSafe<{
    data: Article[]
    meta: { current_page: number; last_page: number; per_page: number; total: number }
    query: string
  }>(`/search?${params}`, 30)
}

// ─── Breaking News ───────────────────────────────────────────

export async function fetchBreakingNews() {
  return apiFetchSafe<{
    data: { id: number; title: string; slug: string; priority: string; published_at: string; category?: { slug: string } }[]
    enabled?: boolean
    speed?: number
  }>('/breaking', 30)
}

// ─── Live Event ──────────────────────────────────────────────

export async function fetchLiveEvents() {
  return apiFetchSafe<{
    data: { id: number; title: string; slug: string; status: string; viewers?: number }[]
  }>('/live', 30)
}

// ─── Popular ─────────────────────────────────────────────────

export async function fetchPopular() {
  return apiFetchSafe<{ data: Article[] }>('/popular', 60)
}

// ─── Settings ────────────────────────────────────────────────

export async function fetchSettings() {
  return apiFetchSafe<{ data: Record<string, unknown> }>('/settings', 600)
}

// ─── Re-export image helper ──────────────────────────────────

export { getImageUrl }
