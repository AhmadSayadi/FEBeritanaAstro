'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'
import { timeAgoID } from '@/lib/date'

interface RecommendedSectionProps {
  articles: Article[]
}

export function RecommendedSection({ articles }: RecommendedSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    }
  }

  const items = articles.slice(0, 12)
  if (items.length === 0) return null

  return (
    <section aria-label="Rekomendasi" className="container-main py-8">
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
        style={{
          background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
        }}
      >
        {/* Badge header */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-base font-bold text-white sm:text-lg">Rekomendasi</span>
        </div>

        <div className="relative">
          {/* Prev button */}
          <button
            onClick={() => scroll('left')}
            aria-label="Sebelumnya"
            className="absolute -left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition-colors hover:bg-white sm:h-10 sm:w-10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Cards carousel */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide sm:gap-4"
          >
            {items.map((article) => {
              const categorySlug = article.category?.slug || 'berita'
              const categoryName = article.category?.name || 'Berita'
              const categoryColor = article.category?.color || '#C62828'
              return (
                <article
                  key={article.id}
                  className="w-[240px] shrink-0 overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800 sm:w-[280px]"
                >
                  <Link href={`/${categorySlug}/${article.slug}`} aria-label={`Baca: ${article.title}`}>
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={getImageUrl(article.thumbnail_url, { width: 400 })}
                        alt={article.thumbnail_alt || article.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 640px) 240px, 280px"
                        loading="lazy"
                        {...getBlurProps(article.thumbnail_blur)}
                      />
                    </div>
                  </Link>

                  <div className="relative px-4 pb-4 pt-6">
                    {/* Category badge — overlapping the image bottom */}
                    <span
                      className="cat-badge absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-3 py-1 text-xs font-bold shadow-sm dark:bg-gray-700"
                      style={{ color: categoryColor }}
                    >
                      {categoryName}
                    </span>

                    <Link href={`/${categorySlug}/${article.slug}`} aria-label={`Baca: ${article.title}`}>
                      <h3 className="line-clamp-3 min-h-[3.75rem] text-center text-sm font-bold leading-snug text-gray-900 hover:text-primary dark:text-white">
                        {article.title}
                      </h3>
                    </Link>
                    <time
                      dateTime={article.published_at}
                      suppressHydrationWarning
                      className="mt-2 block text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      {timeAgoID(article.published_at)}
                    </time>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Next button */}
          <button
            onClick={() => scroll('right')}
            aria-label="Selanjutnya"
            className="absolute -right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition-colors hover:bg-white sm:h-10 sm:w-10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
