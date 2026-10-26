/**
 * Static tail of the article page — the "Berita Lainnya" grid.
 *
 * SERVER component (no 'use client'): Astro renders it to pure HTML and ships
 * ZERO JavaScript for it. The sidebar is handled by ArticleSidebar.astro.
 * Markup/classes identical to the original ArticlePageView tail.
 */
import type { Article } from '@/lib/types'
import { ArticleCard } from '@/components/article/ArticleCard'

export function ArticleMoreGrid({ latest }: { latest: Article[] }) {
  if (!latest || latest.length === 0) return null
  return (
    <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        <span className="inline-block h-6 w-1 bg-primary" aria-hidden="true"></span>
        Berita Lainnya
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {latest.slice(0, 8).map((a) => (
          <ArticleCard key={a.id} article={a} size="medium" />
        ))}
      </div>
    </div>
  )
}
