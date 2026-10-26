'use client'

/**
 * Presentational category page — extracted verbatim from the old Next.js
 * `src/app/kategori/[slug]/page.tsx` return JSX (minus the JSON-LD, which the
 * Astro route emits server-side). Rendered as a hydrated island so the
 * AdBanner + CategoryArticleList (view toggle + infinite scroll) work as before.
 */
import { CategoryArticleList } from '@/components/category/CategoryArticleList'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import type { Article } from '@/lib/types'

interface Props {
  slug: string
  categoryName: string
  categoryColor: string
  categoryDesc: string
  articles: Article[]
  totalPages: number
}

export function CategoryPageView({
  slug,
  categoryName,
  categoryColor,
  categoryDesc,
  articles,
  totalPages,
}: Props) {
  return (
    <>
      <Breadcrumb items={[{ name: categoryName }]} />

      {/* Category Banner Header */}
      <section className="container-main mb-8">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {/* Accent bar */}
          <div
            className="absolute left-0 top-0 h-full w-1.5"
            style={{ backgroundColor: categoryColor }}
            aria-hidden="true"
          />
          <div className="py-8 pl-6 pr-4 sm:py-10 sm:pl-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Kanal {categoryName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              {categoryDesc}
            </p>
          </div>
          {/* Decorative gradient on right */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-1/4 opacity-10"
            style={{ background: `linear-gradient(to left, ${categoryColor}, transparent)` }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Ad: kategori_atas */}
      <div className="container-main mb-6">
        <AdBanner posisi="kategori_atas" category={slug} />
      </div>

      {/* Article List with View Toggle + Infinite Scroll */}
      <section className="container-main pb-12">
        <CategoryArticleList
          articles={articles}
          categoryName={categoryName}
          categoryColor={categoryColor}
          categorySlug={slug}
          totalPages={totalPages}
        />
      </section>
    </>
  )
}
