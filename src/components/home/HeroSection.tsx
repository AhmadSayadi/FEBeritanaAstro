'use client'

import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { useState, useEffect, useCallback } from 'react'
import { Article } from '@/lib/types'
import { ArticleCard } from '@/components/article/ArticleCard'
import { getImageUrl, getBlurProps } from '@/lib/api'
import { formatDateID } from '@/lib/date'

interface HeroSectionProps {
  featured: Article
  latestNews: Article[]
  sliderArticles?: Article[]
}

function formatDate(dateString: string): string {
  return formatDateID(dateString)
}

export function HeroSection({ latestNews, sliderArticles }: HeroSectionProps) {
  const slides = sliderArticles?.slice(0, 5) || []
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1))
  }, [slides.length])

  const next = useCallback(() => {
    setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))
  }, [slides.length])

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  return (
    <section aria-label="Berita utama" className="container-main py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left - Slider (60%) */}
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl">
            {/* All slides stacked - only active one visible */}
            <div className="relative aspect-[16/10]">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <Link
                    href={`/${slide.category?.slug || 'berita'}/${slide.slug}`}
                    className="block h-full w-full"
                    aria-label={`Baca selengkapnya: ${slide.title}`}
                    tabIndex={index === current ? 0 : -1}
                  >
                    <Image
                      src={getImageUrl(slide.thumbnail_url, { width: 720, skipProxy: true })}
                      alt={slide.thumbnail_alt || slide.title}
                      title={slide.title}
                      fill
                      priority={index === 0}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 720px"
                      {...getBlurProps(slide.thumbnail_blur)}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <span className="badge-category mb-2 inline-block">
                        {slide.category?.name || 'Berita'}
                      </span>
                      <h2 className="text-lg font-bold text-white sm:text-xl lg:text-2xl">
                        {slide.title}
                      </h2>
                      {slide.views && slide.views > 100 && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {slide.views >= 1000 ? `${(slide.views / 1000).toFixed(1)}k` : slide.views} sedang membaca
                        </span>
                      )}
                      <time dateTime={slide.published_at} className="mt-2 block text-sm text-gray-300">
                        {formatDate(slide.published_at)}
                      </time>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Previous button */}
            <button
              onClick={prev}
              aria-label="Slide sebelumnya"
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next button */}
            <button
              onClick={next}
              aria-label="Slide selanjutnya"
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots — tombol punya area sentuh 24x24px (WCAG target size),
                dot visual tetap kecil di dalamnya */}
            <div className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  aria-label={`Slide ${index + 1}`}
                  aria-current={index === current ? 'true' : undefined}
                  className="flex h-6 w-6 items-center justify-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      index === current
                        ? 'w-5 bg-white'
                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Latest News (40%) — shows articles from same category as active slide */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Berita Terbaru</h2>
          <div className="space-y-4">
            {latestNews.slice(0, 4).map((article) => {
              const isActive = slides[current]?.slug === article.slug
              return (
                <div
                  key={article.id}
                  className={`rounded-lg px-2 py-1 transition-colors duration-300 ${isActive ? 'bg-primary/5' : ''}`}
                >
                  <ArticleCard article={article} size="small" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
