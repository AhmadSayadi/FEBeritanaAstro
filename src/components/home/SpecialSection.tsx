'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Article } from '@/lib/types'
import { getImageUrl, getBlurProps } from '@/lib/api'

interface SpecialSectionProps {
  title: string
  slug: string
  type?: 'category' | 'tag'
  template?: 'normal' | 'event'
  bgColor?: string
  bgImage?: string
  logoImage?: string
  description?: string
  ctaText?: string
  ctaUrl?: string
  limit?: number
  initialArticles?: Article[]
}

export function SpecialSection({
  title,
  slug,
  type = 'category',
  template = 'normal',
  bgColor = '#1B5E20',
  bgImage,
  logoImage,
  description,
  ctaText = 'Selengkapnya',
  ctaUrl,
  limit = 4,
  initialArticles,
}: SpecialSectionProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles || [])

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) return
    const endpoint = type === 'tag'
      ? `/api/feed?tag=${slug}&limit=${limit}`
      : `/api/feed?category=${slug}&limit=${limit}`

    fetch(endpoint)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setArticles(data.data) })
      .catch(() => {})
  }, [slug, type, limit, initialArticles])

  if (!articles.length) return null

  const linkUrl = ctaUrl || (type === 'tag' ? `/tag/${slug}` : `/${slug}`)

  if (template === 'event') {
    return <EventTemplate title={title} articles={articles} bgColor={bgColor} bgImage={bgImage} logoImage={logoImage} description={description} ctaText={ctaText} linkUrl={linkUrl} slug={slug} />
  }

  return <NormalTemplate title={title} articles={articles} bgColor={bgColor} bgImage={bgImage} linkUrl={linkUrl} slug={slug} limit={limit} />
}

// ─── Template 1: Normal (judul + grid artikel) ───────────────

function NormalTemplate({ title, articles, bgColor, bgImage, linkUrl, slug, limit }: {
  title: string; articles: Article[]; bgColor: string; bgImage?: string; linkUrl: string; slug: string; limit: number
}) {
  const bgStyle: React.CSSProperties = bgImage
    ? { backgroundImage: `url(${getImageUrl(bgImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(to bottom, ${bgColor}, ${darkenColor(bgColor, 60)})` }

  return (
    <section className="container-main py-4">
      <div className="overflow-hidden rounded-2xl" style={bgStyle}>
        <div className={`px-6 py-6 ${bgImage ? 'bg-black/40' : ''}`}>
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <Link href={linkUrl} className="text-sm font-medium text-white/80 hover:text-white">
              Selengkapnya »
            </Link>
          </div>

          {/* Articles grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {articles.slice(0, limit).map((article) => (
              <Link key={article.id} href={`/${article.category?.slug || slug}/${article.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={getImageUrl(article.thumbnail_url, { width: 400 })}
                    alt={article.thumbnail_alt || article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    loading="lazy"
                    {...getBlurProps(article.thumbnail_blur)}
                    unoptimized
                  />
                </div>
                <h3 className="mt-2 line-clamp-3 text-sm font-medium leading-snug text-white group-hover:text-white/80">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Template 2: Event (logo + desc kiri, artikel kanan) ─────

function EventTemplate({ title, articles, bgColor, bgImage, logoImage, description, ctaText, linkUrl, slug }: {
  title: string; articles: Article[]; bgColor: string; bgImage?: string; logoImage?: string; description?: string; ctaText: string; linkUrl: string; slug: string
}) {
  const bgStyle: React.CSSProperties = bgImage
    ? { backgroundImage: `url(${getImageUrl(bgImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(to bottom, ${bgColor}, ${darkenColor(bgColor, 60)})` }

  return (
    <section className="container-main py-4">
      <div className="overflow-hidden rounded-2xl" style={bgStyle}>
        <div className={`flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center ${bgImage ? 'bg-black/40' : ''}`}>
          {/* Left — logo + description + CTA */}
          <div className="shrink-0 sm:w-64">
            {logoImage && (
              <div className="mb-4 flex justify-center">
                <Image
                  src={getImageUrl(logoImage)}
                  alt={title}
                  width={160}
                  height={80}
                  className="h-20 w-auto object-contain drop-shadow-lg"
                  unoptimized
                />
              </div>
            )}
            {!logoImage && (
              <h2 className="mb-2 text-xl font-bold text-white">{title}</h2>
            )}
            {description && (
              <p className="mb-4 text-sm leading-relaxed text-white/80">{description}</p>
            )}
            <Link
              href={linkUrl}
              className="inline-block rounded-lg border-2 border-white bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              {ctaText}
            </Link>
          </div>

          {/* Right — articles */}
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <Link key={article.id} href={`/${article.category?.slug || slug}/${article.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={getImageUrl(article.thumbnail_url, { width: 400 })}
                    alt={article.thumbnail_alt || article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    loading="lazy"
                    {...getBlurProps(article.thumbnail_blur)}
                    unoptimized
                  />
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white group-hover:text-white/80">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Helper: darken a hex color by amount (0-255)
function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount)
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount)
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
