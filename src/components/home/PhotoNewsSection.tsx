'use client'

import React from 'react'
import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface PhotoNewsSectionProps {
  articles: Article[]
}

function formatViews(views: number | undefined): string {
  if (!views || views <= 0) return '0'
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`
  return views.toString()
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return '1 hari yang lalu'
  if (diffDays < 7) return `${diffDays} hari yang lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PhotoNewsSection({ articles }: PhotoNewsSectionProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <section aria-label="Beritana Foto" className="container-main py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-6 w-1 bg-primary" aria-hidden="true"></span>
          Beritana Foto
        </h2>
        <Link href="/foto" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary">
          Lihat Semua
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Photo carousel with side buttons */}
      <div className="relative">
        <button onClick={() => scroll('left')} aria-label="Scroll kiri" className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform hover:scale-105">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={() => scroll('right')} aria-label="Scroll kanan" className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform hover:scale-105">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {articles.slice(0, 5).map((article) => (
          <Link
            key={article.id}
            href={`/foto/${article.slug}`}
            className="group relative aspect-[3/4] w-44 shrink-0 overflow-hidden rounded-xl sm:w-52"
            aria-label={`Baca selengkapnya: ${article.title}`}
          >
            <Image
              src={getImageUrl(article.thumbnail_url, { width: 400 })}
              alt={article.thumbnail_alt || article.title}
              title={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              loading="lazy"
              {...getBlurProps(article.thumbnail_blur)}
              unoptimized
            />

            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* View count badge */}
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-[11px] font-semibold text-white">{formatViews(article.views)}</span>
            </div>

            {/* Title and date at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
                {article.title}
              </h3>
              <time dateTime={article.published_at} className="mt-1 block text-xs text-gray-300" suppressHydrationWarning>
                {formatRelativeDate(article.published_at)}
              </time>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </section>
  )
}
