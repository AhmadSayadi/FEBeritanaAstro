'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatDateID } from '@/lib/date'
import Image from 'next/image'
import { Article } from '@/lib/types'
import { ArticleCard } from '@/components/article/ArticleCard'
import { AdBanner } from '@/components/ads/AdBanner'
import { getImageUrl } from '@/lib/api'

interface Props {
  articles: Article[]
  categoryName: string
  categoryColor: string
  categorySlug: string
  totalPages?: number
}

export function CategoryArticleList({ articles, categoryName, categoryColor, categorySlug, totalPages = 1 }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>(articles)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [page, setPage] = useState(1)
  const observerRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const nextPage = page + 1
      const res = await fetch(`/api/category/${categorySlug}?page=${nextPage}&limit=12`)
      const data = await res.json()

      if (data.data && data.data.length > 0) {
        setDisplayedArticles(prev => [...prev, ...data.data])
        setPage(nextPage)
        if (nextPage >= (data.meta?.last_page || totalPages)) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    }

    setLoading(false)
  }, [loading, hasMore, page, categorySlug, totalPages])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const el = observerRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [loadMore, hasMore, loading])

  return (
    <>
      {/* Section header with view toggle */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
          Berita Seputar {categoryName}
        </h2>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            aria-label="Tampilan grid"
            title="Grid"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            aria-label="Tampilan list"
            title="List"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Articles */}
      {displayedArticles.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedArticles.map((article, idx) => (
              <React.Fragment key={article.id}>
                {idx === 3 && <div className="col-span-full"><AdBanner posisi="kategori_sisipan" category={categorySlug} /></div>}
                <ArticleCard article={article} size="medium" />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
            {displayedArticles.map((article, idx) => (
              <React.Fragment key={article.id}>
                {idx === 3 && <div className="py-4"><AdBanner posisi="kategori_sisipan" category={categorySlug} /></div>}
                <ArticleListItem article={article} categoryColor={categoryColor} />
              </React.Fragment>
            ))}
          </div>
        )
      ) : (
        <p className="text-gray-600 dark:text-gray-400">Belum ada artikel di kategori ini.</p>
      )}

      {/* Loading skeleton */}
      {loading && (
        viewMode === 'grid' ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        )
      )}

      {/* Sentinel for intersection observer */}
      {hasMore && <div ref={observerRef} className="h-10" />}

      {/* End message */}
      {!hasMore && displayedArticles.length > 0 && (
        <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Semua artikel sudah ditampilkan
        </p>
      )}
    </>
  )
}

// ─── List Item ───────────────────────────────────────────────

function ArticleListItem({ article, categoryColor }: { article: Article; categoryColor: string }) {
  const categorySlug = article.category?.slug || 'nasional'
  const articleUrl = `/${categorySlug}/${article.slug}`
  const formattedDate = formatDateID(article.published_at)

  return (
    <a href={articleUrl} className="group flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
        <Image
          src={getImageUrl(article.thumbnail_url, { width: 288 })}
          alt={article.thumbnail_alt || article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 112px, 144px"
          loading="lazy"
          unoptimized
        />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white sm:text-base">
          {article.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {article.category?.name && (
            <>
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: categoryColor }}
                aria-hidden="true"
              />
              <span>{article.category.name}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={article.published_at}>{formattedDate}</time>
        </div>
      </div>
    </a>
  )
}

// ─── Skeletons ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="h-44 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4">
        <div className="mb-2 h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}

function SkeletonListItem() {
  return (
    <div className="flex animate-pulse gap-4 py-4">
      <div className="h-20 w-28 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 sm:h-24 sm:w-36" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}
