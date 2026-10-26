'use client'

import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { useRef, useState } from 'react'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface EKoranItem {
  id: number
  title: string
  date: string
  cover_url: string
  views?: string
  pdf_url?: string
  page_count?: number
}

interface EKoranSectionProps {
  items: EKoranItem[]
  backgroundUrl?: string
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Baru saja'
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays === 1) return '1 hari yang lalu'
  return `${diffDays} hari yang lalu`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function EKoranSection({ items, backgroundUrl }: EKoranSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedItem, setSelectedItem] = useState<EKoranItem | null>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const bgImage = backgroundUrl || undefined

  return (
    <>
      <section aria-label="e-Koran" className="container-main py-10">
        <div className="relative overflow-hidden rounded-2xl">
        {/* Background image */}
        <div className="absolute inset-0">
          {bgImage ? (
            <Image
              src={bgImage}
              alt=""
              role="presentation"
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 640px) 640px, 100vw"
              quality={60}
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-gray-900" />
          )}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 px-6 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-2xl font-bold text-white">
              <span className="text-primary">e</span>koran.
            </span>
            <Link href="/ekoran" className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white">
              Lihat Semua
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* Carousel with side nav buttons */}
          <div className="relative">
            {/* Left button */}
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll kiri"
              className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right button */}
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll kanan"
              className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          >
            {items.map((item) => (
              <article
                key={item.id}
                className="shrink-0 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative h-64 w-44 overflow-hidden rounded-xl transition-transform hover:scale-[1.02] sm:h-72 sm:w-48">
                  <Image
                    src={getImageUrl(item.cover_url, { width: 320 })}
                    alt={`Cover e-Koran: ${item.title}`}
                    fill
                    className="object-cover"
                    sizes="192px"
                    loading="lazy"
                    {...getBlurProps()}
                    unoptimized
                  />
                  {/* View count badge */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white">
                      {item.views || '0'}
                    </span>
                  </div>
                </div>
                {/* Title and date below card */}
                <div className="mt-2 w-44 sm:w-48">
                  <h3 className="line-clamp-2 text-sm font-medium text-white">
                    {item.title}
                  </h3>
                  <time className="mt-0.5 block text-xs text-gray-400">
                    {formatRelativeDate(item.date)}
                  </time>
                </div>
              </article>
            ))}
          </div>
          </div>
        </div>
        </div>
      </section>

      {/* Modal Viewer */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          {/* Header bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
                aria-label="Tutup"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">{selectedItem.title}</h2>
                <p className="text-xs text-gray-400">{formatRelativeDate(selectedItem.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedItem.pdf_url && (
                <a
                  href={getImageUrl(selectedItem.pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                >
                  Baca Deskripsi
                </a>
              )}
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
                aria-label="Bagikan"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Cover image - centered */}
          <div className="relative mt-14 max-h-[80vh] max-w-lg">
            <Image
              src={getImageUrl(selectedItem.cover_url)}
              alt={`e-Koran: ${selectedItem.title}`}
              width={500}
              height={700}
              className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
              unoptimized
              priority
            />

            {/* Navigation arrows */}
            <button
              onClick={() => {
                const idx = items.findIndex(i => i.id === selectedItem.id)
                if (idx > 0) setSelectedItem(items[idx - 1])
              }}
              className="absolute left-[-50px] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Edisi sebelumnya"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const idx = items.findIndex(i => i.id === selectedItem.id)
                if (idx < items.length - 1) setSelectedItem(items[idx + 1])
              }}
              className="absolute right-[-50px] top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Edisi berikutnya"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-sm text-gray-400">
              {formatDate(selectedItem.date)}
            </p>
            {selectedItem.page_count && (
              <p className="mt-1 rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300 inline-block">
                Halaman 1 dari {selectedItem.page_count}
              </p>
            )}
          </div>

          {/* Click backdrop to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setSelectedItem(null)}
          />
        </div>
      )}
    </>
  )
}
