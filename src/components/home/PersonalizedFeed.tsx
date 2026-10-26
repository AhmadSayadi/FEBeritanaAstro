'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getToken, isLoggedIn } from '@/lib/auth'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface FeedArticle {
  id: number
  title: string
  slug: string
  thumbnail_url: string
  category?: { name: string; slug: string; color?: string }
  published_at: string
}

export function PersonalizedFeed() {
  const [articles, setArticles] = useState<FeedArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false)
      return
    }

    const token = getToken()
    fetch('/api/feed', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data) setArticles(data.data.slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Don't show if not logged in or no data
  if (!isLoggedIn() || (!loading && !articles.length)) return null

  if (loading) {
    return (
      <section className="container-main py-8">
        <div className="mb-5 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="container-main py-8">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <span className="inline-block h-5 w-1 bg-primary" aria-hidden="true" />
        Untuk Anda
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Personalized</span>
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/${article.category?.slug || 'nasional'}/${article.slug}`}
            className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md dark:border-gray-700"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={getImageUrl(article.thumbnail_url, { width: 400 })}
                alt={article.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
                loading="lazy"
                {...getBlurProps()}
                unoptimized
              />
              {article.category && (
                <span
                  className="cat-badge absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: article.category.color || '#E53935' }}
                >
                  {article.category.name}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-primary dark:text-white">
                {article.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
