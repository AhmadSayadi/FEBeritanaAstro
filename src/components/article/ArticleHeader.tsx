import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'
import { formatBylineDateTimeID } from '@/lib/date'
import { TraktirButton } from '@/components/article/ArticleClientComponents'
import { getContentTypeMeta } from '@/lib/contentType'

interface ArticleHeaderProps {
  article: Article
}

/** Label dan warna per content_type — diambil dari shared helper */

export function ArticleHeader({ article }: ArticleHeaderProps) {
  const publishedLabel = formatBylineDateTimeID(article.published_at)
  const contentTypeMeta = getContentTypeMeta(article.content_type)

  // Tanggal diperbarui — prioritas: modified_at > updated_at.
  // Tampilkan hanya jika berbeda minimal 1 menit dari published_at.
  const modifiedRaw = article.modified_at || article.updated_at
  const publishedMs = new Date(article.published_at).getTime()
  const modifiedMs  = new Date(modifiedRaw || '').getTime()
  const showModified =
    modifiedRaw &&
    !isNaN(modifiedMs) &&
    !isNaN(publishedMs) &&
    Math.abs(modifiedMs - publishedMs) > 60_000
  const modifiedLabel = showModified ? formatBylineDateTimeID(modifiedRaw!) : null

  const blurProps = getBlurProps(article.thumbnail_blur)

  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
        {article.title}
      </h1>

      {/* ── Byline bar ── */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">

        {/* Kiri: avatar → nama (link profil) → tanggal → badge content_type */}
        <div className="flex items-start gap-3">
          {article.author?.avatar_url && (
            <Link href={`/profile/${article.author.slug}`} className="mt-0.5 shrink-0" aria-label={`Profil ${article.author.name}`}>
              <Image
                src={getImageUrl(article.author.avatar_url, { width: 80 })}
                alt={`Foto ${article.author.name}`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                unoptimized
              />
            </Link>
          )}

          <div className="flex flex-col leading-snug gap-0.5">
            {/* Nama penulis — link ke halaman profil */}
            {article.author && (
              <Link
                href={`/profile/${article.author.slug}`}
                className="text-sm font-semibold text-primary hover:underline"
                rel="author"
              >
                {article.author.name}
                {article.author.role && (
                  <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                    · {article.author.role}
                  </span>
                )}
              </Link>
            )}

            {/* Tanggal terbit */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <time dateTime={article.published_at}>
                Terbit {publishedLabel} WIB
              </time>

              {/* Tanggal diperbarui — hanya tampil kalau berbeda */}
              {modifiedLabel && modifiedRaw && (
                <time dateTime={modifiedRaw} className="flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Diperbarui {modifiedLabel} WIB
                </time>
              )}
            </div>

            {/* Badge content_type */}
            {contentTypeMeta && (
              <span className={`mt-1 inline-block self-start rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${contentTypeMeta.className}`}>
                {contentTypeMeta.label}
              </span>
            )}
          </div>
        </div>

        {/* Kanan: tombol Traktir Kopi */}
        <TraktirButton article={article} />
      </div>

      {/* ── Atribusi sumber (hanya untuk content_type = adaptasi atau bila ada source_url) ── */}
      {(article.source_url || article.source_name) && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          Dilansir dari{' '}
          {article.source_url ? (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary hover:underline font-medium"
            >
              {article.source_name || article.source_url}
            </a>
          ) : (
            <span className="font-medium">{article.source_name}</span>
          )}
        </p>
      )}

      {/* ── Catatan pengecekan fakta ── */}
      {article.fact_checked_by && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            Telah dicek faktanya oleh{' '}
            <Link
              href={`/profile/${article.fact_checked_by.slug}`}
              className="font-semibold hover:underline"
            >
              {article.fact_checked_by.name}
            </Link>
            {article.fact_checked_at && (
              <> pada {formatBylineDateTimeID(article.fact_checked_at)} WIB</>
            )}
          </span>
        </div>
      )}

      {/* ── Hero image ── */}
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
        {(article.thumbnail_credit || article.thumbnail_alt) && (
          <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {article.thumbnail_credit || article.thumbnail_alt}
          </figcaption>
        )}
      </figure>
    </header>
  )
}
