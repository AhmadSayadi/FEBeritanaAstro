'use client'

import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { useRef } from 'react'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface VideoStorySectionProps {
  articles: Article[]
}

export function VideoStorySection({ articles }: VideoStorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section aria-label="Video Story" className="container-main overflow-hidden py-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-6 w-1 bg-primary" aria-hidden="true"></span>
          Beritana Video Story
        </h2>
        <Link href="/video" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary">
          Lihat Semua
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Video carousel with prev/next buttons */}
      <div className="relative">
        {/* Previous button */}
        <button
          onClick={() => scroll('left')}
          aria-label="Video sebelumnya"
          className="absolute left-2 top-[40%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:gap-4"
        >
          {articles.slice(0, 8).map((article) => (
            <article key={article.id} className="w-40 shrink-0 sm:w-48 lg:w-52">
              {/* Video thumbnail */}
              <Link
                href={`/video/${article.slug}`}
                className="group relative block aspect-[9/16] overflow-hidden rounded-xl"
                aria-label={`Tonton video: ${article.title}`}
              >
                <Image
                  src={getImageUrl(article.thumbnail_url, { width: 400 })}
                  alt={article.thumbnail_alt || article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 208px"
                  loading="lazy"
                  {...getBlurProps(article.thumbnail_blur)}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                {/* News badge top-left */}
                <div className="absolute left-2 top-2">
                  <span className="rounded bg-primary-dark px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    News Update
                  </span>
                </div>

                {/* Caption overlay */}
                <div className="absolute inset-x-2 bottom-10 sm:inset-x-3 sm:bottom-12">
                  <p className="line-clamp-3 rounded bg-black/50 px-2 py-1.5 text-[11px] font-medium leading-tight text-white backdrop-blur-sm sm:text-xs">
                    {article.title}
                  </p>
                </div>

                {/* Play button + duration at bottom */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 sm:h-7 sm:w-7">
                    <svg className="h-3 w-3 text-gray-900 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white sm:text-[11px]">
                    {(article as { duration?: string }).duration || ''}
                  </span>
                </div>
              </Link>

              {/* Title and source below */}
              <div className="mt-2">
                <Link href={`/video/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
                  <h3 className="line-clamp-2 text-xs font-bold text-gray-900 hover:text-primary sm:text-sm">
                    {article.title}
                  </h3>
                </Link>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[11px] font-medium text-gray-600 sm:text-xs">
                    {article.author?.name || 'Redaksi'}
                  </span>
                  <svg className="h-3 w-3 text-blue-500 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => scroll('right')}
          aria-label="Video selanjutnya"
          className="absolute right-2 top-[40%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
