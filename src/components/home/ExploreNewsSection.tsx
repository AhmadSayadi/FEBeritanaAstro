'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface ExploreNewsSectionProps {
  articles: Article[]
  popularArticles: Article[]
  perPage?: number
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays === 1) return '1 hari yang lalu'
  return `${diffDays} hari yang lalu`
}

function formatViews(views: number | undefined): string {
  if (!views || views <= 0) return '0'
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`
  return views.toString()
}

export function ExploreNewsSection({ articles, popularArticles, perPage = 5 }: ExploreNewsSectionProps) {
  const [displayedCount, setDisplayedCount] = useState(perPage)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const hasMore = displayedCount < articles.length
  const currentArticles = articles.slice(0, displayedCount).filter(a => a && a.slug && a.title)

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    setLoading(true)

    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + perPage, articles.length))
      setLoading(false)
    }, 600)
  }, [articles.length, hasMore, loading, perPage])

  useEffect(() => {
    const currentRef = loaderRef.current
    if (!currentRef || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(currentRef)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  return (
    <section aria-label="Berita Terbaru" className="container-main py-8">
      <div className="flex gap-8">
        {/* Main content - left */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="inline-block h-6 w-1 bg-primary" aria-hidden="true"></span>
              BERITA TERBARU
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Tampilan grid"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <rect x="2" y="2" width="7" height="7" rx="1.5" />
                  <rect x="11" y="2" width="7" height="7" rx="1.5" />
                  <rect x="2" y="11" width="7" height="7" rx="1.5" />
                  <rect x="11" y="11" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Tampilan list"
                aria-pressed={viewMode === 'list'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <rect x="3" y="4" width="14" height="2" rx="1" />
                  <rect x="3" y="9" width="14" height="2" rx="1" />
                  <rect x="3" y="14" width="14" height="2" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* List view */}
          {viewMode === 'list' && (
            <div className="divide-y divide-gray-100">
              {currentArticles.map((article) => (
                <article key={article.id} className="flex gap-4 py-4">
                  <Link href={`/${(article.category?.slug || "berita")}/${article.slug}`} className="shrink-0">
                    <div className="relative h-[72px] w-[120px] overflow-hidden rounded-lg sm:h-[84px] sm:w-[140px]">
                      <Image src={getImageUrl(article.thumbnail_url, { width: 280 })} alt={article.thumbnail_alt || article.title} fill className="object-cover" sizes="140px" loading="lazy" {...getBlurProps(article.thumbnail_blur)} unoptimized />
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/${(article.category?.slug || "berita")}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
                      <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 hover:text-primary">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">{article.excerpt}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <time dateTime={article.published_at} suppressHydrationWarning>{formatRelativeTime(article.published_at)}</time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Grid view */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {currentArticles.map((article) => (
                <article key={article.id} className="group">
                  <Link href={`/${(article.category?.slug || "berita")}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
                    <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                      <Image src={getImageUrl(article.thumbnail_url, { width: 600 })} alt={article.thumbnail_alt || article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" {...getBlurProps(article.thumbnail_blur)} unoptimized />
                    </div>
                  </Link>
                  <div className="mt-2.5">
                    <Link href={`/${(article.category?.slug || "berita")}/${article.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-primary">{article.title}</h3>
                    </Link>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <time dateTime={article.published_at} suppressHydrationWarning>{formatRelativeTime(article.published_at)}</time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse gap-4 py-4">
                  <div className="h-[72px] w-[120px] shrink-0 rounded-lg bg-gray-200 sm:h-[84px] sm:w-[140px]" />
                  <div className="flex flex-1 flex-col justify-center gap-2.5">
                    <div className="h-4 w-[90%] rounded bg-gray-200" />
                    <div className="h-4 w-[60%] rounded bg-gray-200" />
                    <div className="h-3 w-[30%] rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scroll trigger */}
          {hasMore && <div ref={loaderRef} className="h-10" />}

          {/* End — link to full index */}
          {!hasMore && !loading && (
            <div className="py-6 text-center">
              <Link href="/berita" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
                Lihat Semua Berita
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar - Terpopuler (sticky) */}
        <aside aria-label="Berita terpopuler" className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-24">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="inline-block h-5 w-1 bg-primary" aria-hidden="true"></span>
              Terpopuler
            </h3>
            <div className="space-y-4">
              {popularArticles.slice(0, 5).map((article, idx) => (
                <article key={article.id} className="flex gap-3">
                  <span className="shrink-0 text-2xl font-bold text-primary">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/${(article.category?.slug || "berita")}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
                      <h4 className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-primary">{article.title}</h4>
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <time dateTime={article.published_at} suppressHydrationWarning>{formatRelativeTime(article.published_at)}</time>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {formatViews(article.views)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/${(article.category?.slug || "berita")}/${article.slug}`} className="shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded">
                      <Image src={getImageUrl(article.thumbnail_url, { width: 128 })} alt={article.thumbnail_alt || article.title} fill className="object-cover" sizes="64px" loading="lazy" {...getBlurProps(article.thumbnail_blur)} unoptimized />
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
