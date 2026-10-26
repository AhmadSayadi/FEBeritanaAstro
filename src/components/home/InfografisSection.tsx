'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl, getBlurProps } from '@/lib/api'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface InfografisItem {
  id: number
  title: string
  slug: string
  thumbnail_url: string
  category?: { id?: number; name?: string; slug?: string; color?: string }
}

export function InfografisSection({ initialData }: { initialData?: InfografisItem[] }) {
  const [items, setItems] = useState<InfografisItem[]>(initialData || [])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialData && initialData.length > 0) return
    fetch('/api/photo-news?category=infografis&limit=8')
      .then(res => res.json())
      .then(data => setItems(data?.data || []))
      .catch(() => {})
  }, [initialData])

  if (!items.length) return null

  // Get category color from first item
  const categoryColor = items[0]?.category?.color || '#8B5CF6'

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <section className="container-main py-8">
      <div className="rounded-xl py-6 px-4" style={{ backgroundColor: hexToRgba(categoryColor, 0.08) }}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-5 w-1 rounded" style={{ backgroundColor: categoryColor }} aria-hidden="true" />
          Infografis
        </h2>
        <Link href="/infografis" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400">
          Lihat Semua
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
      <div className="relative">
        {/* Left button */}
        <button onClick={() => scroll('left')} aria-label="Scroll kiri" className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform hover:scale-105">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        {/* Right button */}
        <button onClick={() => scroll('right')} aria-label="Scroll kanan" className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform hover:scale-105">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link key={item.id} href={`/foto/${item.slug}`} className="group shrink-0">
            <div className="relative h-72 w-48 overflow-hidden rounded-xl sm:h-80 sm:w-56">
              <Image
                src={getImageUrl(item.thumbnail_url, { width: 336 })}
                alt={item.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="224px"
                loading="lazy"
                {...getBlurProps()}
                unoptimized
              />
            </div>
            <p className="mt-2 line-clamp-2 w-48 text-xs font-medium text-gray-700 group-hover:text-primary dark:text-gray-300 sm:w-56">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
      </div>
      </div>
    </section>
  )
}
