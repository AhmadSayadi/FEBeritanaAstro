'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface TrendingArticle {
  rank: number
  article: {
    id: number
    title: string
    slug: string
    thumbnail_url: string
    thumbnail_blur?: string
    category?: { name: string; slug: string; color?: string }
  }
  trend_score?: number
  view_growth?: number
}

export function TrendingTodaySection({ initialData }: { initialData?: TrendingArticle[] }) {
  const [items, setItems] = useState<TrendingArticle[]>(initialData || [])
  // `loading` is true only while the first client fetch is in flight (no SSR
  // data). During that window we reserve the section's height so it doesn't pop
  // in and shift the page (CLS). Once resolved empty, we return null (no gap).
  const [loading, setLoading] = useState(!(initialData && initialData.length > 0))
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialData && initialData.length > 0) return
    fetch('/api/trending-today')
      .then(res => res.json())
      .then(data => setItems(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialData])

  // Reserve height while the first fetch is pending (prevents CLS).
  if (!items.length && loading) {
    return <section className="container-main py-10" aria-hidden="true"><div className="h-[320px] rounded-2xl bg-gray-100 dark:bg-gray-800/40" /></section>
  }
  if (!items.length) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' })
  }

  return (
    <section className="container-main py-10">
      <div className="overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)' }}>
        <div className="px-6 py-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="inline-block rounded-full bg-white/20 px-6 py-2 text-2xl font-bold text-white backdrop-blur-sm">
              Naik Daun Hari Ini
            </h2>
          </div>

          {/* Carousel */}
          <div className="relative">
            <button
              onClick={() => scroll('left')}
              className="absolute -left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-gray-700 shadow-xl transition-transform hover:scale-105"
              aria-label="Sebelumnya"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div ref={scrollRef} className="flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
              {items.map((item, idx) => (
                <Link
                  key={item.article.id}
                  href={`/${item.article.category?.slug || 'nasional'}/${item.article.slug}`}
                  className="group w-[180px] shrink-0 sm:w-[200px]"
                >
                  <div className="relative overflow-hidden rounded-xl border-l-4 border-b-4 border-yellow-400 bg-white shadow-xl transition-transform group-hover:scale-[1.02]">
                    {/* Rank badge */}
                    <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow">
                      {item.rank || idx + 1}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={getImageUrl(item.article.thumbnail_url, { width: 400 })}
                        alt={item.article.title}
                        fill
                        className="object-cover"
                        sizes="200px"
                        loading="lazy"
                        {...getBlurProps(item.article.thumbnail_blur)}
                        unoptimized
                      />
                    </div>

                    {/* Title */}
                    <div className="p-3">
                      <p className="line-clamp-3 text-xs font-semibold leading-snug text-gray-800">
                        {item.article.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll('right')}
              className="absolute -right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-gray-700 shadow-xl transition-transform hover:scale-105"
              aria-label="Selanjutnya"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
