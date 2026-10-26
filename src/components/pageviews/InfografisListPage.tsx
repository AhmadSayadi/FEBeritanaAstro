'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { getImageUrl } from '@/lib/api'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface InfografisItem {
  id: number
  title: string
  slug: string
  thumbnail_url: string
  published_at: string
  views?: number
  category?: { id?: number; name?: string; slug?: string; color?: string }
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return '1 hari yang lalu'
  if (diffDays < 7) return `${diffDays} hari yang lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  initialData: InfografisItem[]
}

export function InfografisListPage({ initialData }: Props) {
  const [items, setItems] = useState<InfografisItem[]>(initialData)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialData.length >= 24)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/photo-news?category=infografis&limit=24&page=${nextPage}`)
      const data = await res.json()
      const newItems: InfografisItem[] = data?.data || []
      if (newItems.length > 0) {
        setItems(prev => [...prev, ...newItems])
        setPage(nextPage)
        if (newItems.length < 24) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    }
    setLoading(false)
  }, [loading, hasMore, page])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        loadMore()
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  return (
    <>
      <Breadcrumb items={[{ name: 'Infografis' }]} />

      <section className="container-main pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Infografis</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Data dan informasi kompleks dalam visual yang mudah dipahami
          </p>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Belum ada infografis</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/foto/${item.slug}`}
                className="group"
                aria-label={item.title}
              >
                {/* 9:16 aspect ratio */}
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={getImageUrl(item.thumbnail_url, { width: 400 })}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    loading="lazy"
                    unoptimized
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Views badge */}
                  {item.views && item.views > 0 && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-[10px] font-semibold text-white">
                        {item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
                      </span>
                    </div>
                  )}

                  {/* Title + date at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="line-clamp-3 text-xs font-semibold leading-tight text-white">
                      {item.title}
                    </h3>
                    <time dateTime={item.published_at} className="mt-1 block text-[10px] text-gray-300">
                      {formatRelativeDate(item.published_at)}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">Semua infografis sudah ditampilkan</p>
        )}
      </section>
    </>
  )
}
