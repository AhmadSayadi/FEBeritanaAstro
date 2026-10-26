import Link from 'next/link'
import { Article } from '@/lib/types'
import Image from 'next/image'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface BannerExclusiveProps {
  articles: Article[]
}

export function BannerExclusive({ articles }: BannerExclusiveProps) {
  return (
    <section aria-label="Beritana Eksklusif" className="container-main py-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary-dark to-dark px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left - title */}
          <div className="shrink-0 text-center lg:text-left">
            <h2 className="text-xl font-bold uppercase text-white sm:text-2xl lg:text-3xl">
              Beritana<br className="hidden lg:block" /> Eksklusif
            </h2>
          </div>

          {/* Right - article thumbnails */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:gap-4">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.id}
                href={`/${article.category?.slug || 'berita'}/${article.slug}`}
                className="group"
                aria-label={`Baca selengkapnya: ${article.title}`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg lg:h-24 lg:w-40">
                  <Image
                    src={getImageUrl(article.thumbnail_url, { width: 300 })}
                    alt={article.thumbnail_alt || article.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 160px"
                    loading="lazy"
                    {...getBlurProps(article.thumbnail_blur)}
                    unoptimized
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gray-200 lg:max-w-[160px]">
                  {article.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
