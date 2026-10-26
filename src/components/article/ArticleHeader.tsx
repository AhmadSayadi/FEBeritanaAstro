import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'
import { formatBylineDateTimeID } from '@/lib/date'
import { TraktirButton } from '@/components/article/ArticleClientComponents'

interface ArticleHeaderProps {
  article: Article
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  const formattedDate = formatBylineDateTimeID(article.published_at)

  const blurProps = getBlurProps(article.thumbnail_blur)

  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
        {article.title}
      </h1>

      {/* Meta info — kiri: avatar + penulis + tanggal, kanan: tombol Traktir Kopi */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Kiri: foto penulis, nama, tanggal terbit */}
        <div className="flex items-center gap-3">
          {article.author?.avatar_url && (
            <Link href={`/profile/${article.author.slug}`} className="shrink-0">
              <Image
                src={getImageUrl(article.author.avatar_url, { width: 80 })}
                alt={`Foto ${article.author.name}`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />
            </Link>
          )}

          <div className="flex flex-col leading-tight">
            {article.author && (
              <Link
                href={`/profile/${article.author.slug}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {article.author.name}
              </Link>
            )}
            <time dateTime={article.published_at} className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
              Terbit {formattedDate} WIB
            </time>
          </div>
        </div>

        {/* Kanan: tombol Traktir Kopi */}
        <TraktirButton article={article} />
      </div>

      {/* Hero image — 1200px (Google Discover butuh ≥1200px lebar), rasio 16:9, LCP-priority */}
      <figure className="mt-6">
        <Image
          src={getImageUrl(article.thumbnail_url, { width: 1200 })}
          alt={article.thumbnail_alt || article.title}
          width={1200}
          height={675}
          priority
          fetchPriority="high"
          loading="eager"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
          {...blurProps}
          className="aspect-[16/9] w-full rounded-lg object-cover"
        />
        {/* Caption: credit → alt → title */}
        {(article.thumbnail_credit || article.thumbnail_alt || article.title) && (
          <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {article.thumbnail_credit || article.thumbnail_alt || article.title}
          </figcaption>
        )}
      </figure>
    </header>
  )
}
