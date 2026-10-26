'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface ArticleItem {
  id: number
  title: string
  slug: string
  thumbnail_url: string
  thumbnail_blur?: string
  thumbnail_alt?: string
  published_at: string
  category?: { name: string; slug: string; color?: string } | null
}

interface CategoryColumnData {
  category: { name: string; slug: string; color?: string }
  articles: ArticleItem[]
}

interface RelatedCategoriesProps {
  excludeCategorySlug?: string
}

function formatRelativeTime(dateString: string): string {
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

/**
 * Menampilkan 3 kolom kategori dari homepage API (category_columns).
 * Exclude kategori artikel yang sedang dibuka.
 */
export function RelatedCategories({ excludeCategorySlug }: RelatedCategoriesProps) {
  const [columns, setColumns] = useState<CategoryColumnData[]>([])

  useEffect(() => {
    fetch('/api/homepage')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const cols = data?.data?.category_columns || data?.category_columns || []
        const filtered = cols
          .filter((col: CategoryColumnData) => col.category?.slug !== excludeCategorySlug)
          .slice(0, 3)
        setColumns(filtered)
      })
      .catch(() => {})
  }, [excludeCategorySlug])

  if (!columns.length) return null

  return (
    <section aria-label="Berita per kategori" className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {columns.map((col) => {
          const [main, ...rest] = col.articles
          return (
            <div key={col.category.slug}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  <span
                    className="inline-block h-5 w-1 rounded"
                    style={{ backgroundColor: col.category.color || '#E53935' }}
                    aria-hidden="true"
                  />
                  {col.category.name}
                </h2>
                <Link href={`/${col.category.slug}`} className="text-xs text-gray-500 hover:text-primary">
                  Lihat semua
                </Link>
              </div>

              {/* Main article */}
              {main && (
                <Link href={`/${col.category.slug}/${main.slug}`} className="group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src={getImageUrl(main.thumbnail_url, { width: 400 })}
                      alt={main.thumbnail_alt || main.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      loading="lazy"
                      {...getBlurProps(main.thumbnail_blur)}
                      unoptimized
                    />
                    <span
                      className="cat-badge absolute left-3 top-3 rounded px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: col.category.color || '#E53935' }}
                    >
                      {col.category.name}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-bold text-gray-900 group-hover:text-primary dark:text-white">
                    {main.title}
                  </h3>
                  <time dateTime={main.published_at} className="mt-1 block text-xs text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                    {formatRelativeTime(main.published_at)}
                  </time>
                </Link>
              )}

              {/* Small articles */}
              <div className="mt-4 space-y-3">
                {rest.slice(0, 2).map((article) => (
                  <article key={article.id} className="flex gap-3">
                    <Link href={`/${col.category.slug}/${article.slug}`} className="shrink-0">
                      <div className="relative h-[60px] w-[80px] overflow-hidden rounded">
                        <Image
                          src={getImageUrl(article.thumbnail_url, { width: 160 })}
                          alt={article.thumbnail_alt || article.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                          loading="lazy"
                          {...getBlurProps(article.thumbnail_blur)}
                          unoptimized
                        />
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/${col.category.slug}/${article.slug}`}>
                        <h4 className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary dark:text-white">
                          {article.title}
                        </h4>
                      </Link>
                      <time dateTime={article.published_at} className="mt-1 block text-xs text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                        {formatRelativeTime(article.published_at)}
                      </time>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
