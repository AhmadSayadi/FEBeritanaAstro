'use client'

import { useState, useEffect } from 'react'
import Image from '@/compat/Image'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface SponsoredItem {
  id: number
  title: string
  thumbnail_url: string
  sponsor_name: string
  click_url: string
}

export function SponsoredSection({ initialData }: { initialData?: SponsoredItem[] }) {
  const [items, setItems] = useState<SponsoredItem[]>(initialData || [])
  const [loading, setLoading] = useState(!(initialData && initialData.length > 0))

  useEffect(() => {
    if (initialData && initialData.length > 0) return
    fetch('/api/sponsored')
      .then(res => res.json())
      .then(data => setItems((data?.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialData])

  // Reserve height while the first fetch is pending (prevents CLS).
  if (!items.length && loading) {
    return <section className="container-main py-8" aria-hidden="true"><div className="h-[280px] rounded-xl bg-gray-100 dark:bg-gray-800/40" /></section>
  }
  if (!items.length) return null

  return (
    <section className="container-main py-8">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <span className="inline-block h-5 w-1 bg-gray-400" aria-hidden="true" />
        Konten Pilihan
        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700">Sponsored</span>
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.click_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md dark:border-gray-700"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={getImageUrl(item.thumbnail_url, { width: 400 })}
                alt={item.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
                loading="lazy"
                {...getBlurProps()}
                unoptimized
              />
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-primary dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-[11px] text-gray-400">Sponsored by {item.sponsor_name}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
