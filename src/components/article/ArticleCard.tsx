import Image from 'next/image'
import Link from 'next/link'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'
import { formatDateID } from '@/lib/date'

const FALLBACK = '/images/fallback-thumb.svg'

function getCategoryColor(article: Article): string {
  return article.category?.color || '#E53935'
}

function getSrc(url: string | null | undefined, width?: number): string {
  if (!url || url === 'null' || url === 'undefined') return FALLBACK
  return getImageUrl(url, width ? { width } : undefined)
}

function getAlt(article: Article): string {
  return article.thumbnail_alt || article.title || 'Thumbnail berita'
}

interface ArticleCardProps {
  article: Article
  priority?: boolean
  size?: 'large' | 'medium' | 'small'
}

export function ArticleCard({ article, priority = false, size = 'medium' }: ArticleCardProps) {
  const categorySlug = article.category?.slug || 'nasional'
  const categoryName = article.category?.name || ''
  const categoryColor = getCategoryColor(article)
  const blurProps = getBlurProps(article.thumbnail_blur)

  if (size === 'small') {
    return (
      <article className="flex gap-3">
        <Link href={`/${categorySlug}/${article.slug}`} className="shrink-0">
          <Image
            src={getSrc(article.thumbnail_url, 160)}
            alt={getAlt(article)}
            title={article.title}
            width={80}
            height={60}
            className="h-[60px] w-[80px] rounded object-cover"
            sizes="80px"
            {...blurProps}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/${categorySlug}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary dark:text-white">
              {article.title}
            </h3>
          </Link>
          <time dateTime={article.published_at} className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
            {formatDate(article.published_at)}
          </time>
        </div>
      </article>
    )
  }

  if (size === 'large') {
    return (
      <article className="group relative overflow-hidden rounded-lg">
        <Link href={`/${categorySlug}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
          <div className="relative aspect-[16/9]">
            <Image
              src={getSrc(article.thumbnail_url, 800)}
              alt={getAlt(article)}
              title={article.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
              {...blurProps}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              {categoryName && (
                <span style={{ backgroundColor: categoryColor }} className="cat-badge mb-2 inline-block rounded px-2 py-0.5 text-xs font-semibold text-white">
                  {categoryName}
                </span>
              )}
              <h2 className="text-lg font-bold text-white sm:text-xl lg:text-2xl">
                {article.title}
              </h2>
              <time dateTime={article.published_at} className="mt-2 block text-sm text-gray-300">
                {formatDate(article.published_at)}
              </time>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  // Medium (default)
  return (
    <article className="group">
      <Link href={`/${categorySlug}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <Image
            src={getSrc(article.thumbnail_url, 400)}
            alt={getAlt(article)}
            title={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            {...blurProps}
          />
          {categoryName && (
            <span style={{ backgroundColor: categoryColor }} className="cat-badge absolute left-3 top-3 inline-block rounded px-2 py-0.5 text-xs font-semibold text-white">
              {categoryName}
            </span>
          )}
        </div>
      </Link>
      <div className="mt-3">
        <Link href={`/${categorySlug}/${article.slug}`} aria-label={`Baca selengkapnya: ${article.title}`}>
          <h3 className="line-clamp-2 font-bold text-gray-900 group-hover:text-primary dark:text-white">
            {article.title}
          </h3>
        </Link>
        <time dateTime={article.published_at} className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
          {formatDate(article.published_at)}
        </time>
      </div>
    </article>
  )
}

function formatDate(dateString: string): string {
  return formatDateID(dateString)
}
