'use client'

import React, { useState, useEffect } from 'react'
import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { Article } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { getImageUrl } from '@/lib/api'
import { TopAuthors } from '@/components/author/TopAuthors'

interface AuthorData {
  name: string
  slug: string
  avatar_url: string
  cover_url?: string
  cover_color?: string
  bio: string
  role: string
  verified: boolean
  joined_at: string
  location: string
  social?: Record<string, string | undefined>
  stats: { articles: number; likes: number; comments: number }
  gamification?: {
    total_points: number
    level: { number: number; name: string; badge_name: string; badge_color: string }
    next_level: { progress: number }
    reputation_score: number
    streak: { daily: number; longest: number }
    stats: { articles: number; views: number; trending: number }
    badges: { name: string; color: string }[]
    leaderboard_rank: number
  }
}

interface ArticlesMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface AuthorProfilePageProps {
  author: AuthorData
  articles: Article[]
  articlesMeta?: ArticlesMeta | null
}

type TabType = 'published' | 'liked' | 'comments'

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Social media icon SVGs (logo only)
const SOCIAL_ICONS: Record<string, { icon: React.ReactNode; color: string; baseUrl?: string }> = {
  twitter: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    color: '#000',
    baseUrl: 'https://x.com/',
  },
  instagram: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    ),
    color: '#E4405F',
    baseUrl: 'https://instagram.com/',
  },
  facebook: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ),
    color: '#1877F2',
    baseUrl: 'https://facebook.com/',
  },
  linkedin: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
    color: '#0A66C2',
    baseUrl: 'https://linkedin.com/in/',
  },
  youtube: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ),
    color: '#FF0000',
    baseUrl: 'https://youtube.com/@',
  },
  tiktok: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    ),
    color: '#000',
    baseUrl: 'https://tiktok.com/@',
  },
  website: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
    ),
    color: '#6B7280',
  },
}

function getSocialUrl(key: string, value: string): string {
  if (!value) return '#'
  if (value.startsWith('http')) return value
  const meta = SOCIAL_ICONS[key]
  if (meta?.baseUrl) return `${meta.baseUrl}${value}`
  return value
}

export function AuthorProfilePage({ author, articles, articlesMeta }: AuthorProfilePageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('published')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const user = getCurrentUser() as (ReturnType<typeof getCurrentUser> & { slug?: string }) | null
    if (user && (user.slug === author.slug || user.email === (author.social?.email || ''))) {
      setIsOwner(true)
    } else {
      setIsOwner(false)
    }
  }, [author.slug, author.social])

  const tabs: { id: TabType; label: string; ownerOnly?: boolean }[] = [
    { id: 'published', label: 'Artikel' },
    { id: 'liked', label: 'Disukai', ownerOnly: true },
    { id: 'comments', label: 'Komentar', ownerOnly: true },
  ]

  const visibleTabs = tabs.filter(t => !t.ownerOnly || isOwner)

  // Cover background — image > color > primary gradient fallback
  const coverStyle: React.CSSProperties = author.cover_url
    ? { backgroundImage: `url(${getImageUrl(author.cover_url)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : author.cover_color
    ? { background: `linear-gradient(135deg, ${author.cover_color}, ${author.cover_color}cc)` }
    : {}

  // Filter social links that have values (exclude email)
  const socialLinks = Object.entries(author.social || {})
    .filter(([key, val]) => key !== 'email' && val && val.trim() !== '' && val !== '#')

  return (
    <section className="container-main pb-12">
      {/* Cover + Profile */}
      <div className="relative mb-16">
        <div
          className={`h-32 rounded-b-xl sm:h-44 ${!author.cover_url && !author.cover_color ? 'bg-gradient-to-r from-primary to-primary-dark' : ''}`}
          style={coverStyle}
        />

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6 sm:left-8">
          <Image
            src={getImageUrl(author.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=E53935&color=fff&size=200`}
            alt={author.name}
            width={100}
            height={100}
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-28 sm:w-28"
            unoptimized
          />
        </div>
      </div>

      {/* Profile info */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left sidebar — info */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="space-y-3">
            {/* Name + badge */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{author.name}</h1>
                {author.verified && (
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {author.role && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold capitalize text-primary">{author.role}</span>
                )}
              </div>
              {author.bio && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{author.bio}</p>}
            </div>

            {/* Meta info */}
            <div className="space-y-1.5 text-xs text-gray-500">
              {author.location && (
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {author.location}
                </p>
              )}
              {author.joined_at && (
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Bergabung {formatDate(author.joined_at)}
                </p>
              )}
            </div>

            {/* Social links — icon only */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                {socialLinks.map(([key, val]) => {
                  const meta = SOCIAL_ICONS[key]
                  if (!meta || !val) return null
                  return (
                    <a
                      key={key}
                      href={getSocialUrl(key, val)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      {meta.icon}
                    </a>
                  )
                })}
              </div>
            )}

            {/* Stats */}
            <div className="space-y-1 border-t border-gray-100 pt-3 dark:border-gray-700">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">TOTAL NEWS</span>
                <span className="font-bold text-gray-900 dark:text-white">{author.stats.articles}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">TOTAL LIKES</span>
                <span className="font-bold text-gray-900 dark:text-white">{author.stats.likes}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">TOTAL COMMENTS</span>
                <span className="font-bold text-gray-900 dark:text-white">{author.stats.comments}</span>
              </div>
            </div>

            {/* Gamification */}
            {author.gamification && (
              <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                {/* Level badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: author.gamification.level.badge_color }}
                  >
                    {author.gamification.level.number}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{author.gamification.level.name}</p>
                    <p className="text-[10px] text-gray-400">{author.gamification.total_points.toLocaleString('id-ID')} poin · #{author.gamification.leaderboard_rank}</p>
                  </div>
                </div>

                {/* Progress bar */}
                {author.gamification.next_level && (
                <div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-full rounded-full" style={{ width: `${author.gamification.next_level.progress}%`, backgroundColor: author.gamification.level.badge_color }} />
                  </div>
                </div>
                )}

                {/* Streak */}
                <p className="text-xs text-gray-600 dark:text-gray-400">🔥 Streak {author.gamification.streak?.daily || 0} hari · Terpanjang {author.gamification.streak?.longest || 0}</p>

                {/* Badges */}
                {author.gamification.badges && author.gamification.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {author.gamification.badges.map((badge, i) => (
                      <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: badge.color }}>
                        {badge.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top 10 Leaderboard — desktop only (on mobile appears after articles) */}
            <div className="hidden border-t border-gray-100 pt-4 dark:border-gray-700 lg:block">
              <MiniLeaderboard />
            </div>

            {/* Top 10 Penulis Aktif — desktop only (on mobile appears after articles) */}
            <div className="hidden border-t border-gray-100 pt-4 dark:border-gray-700 lg:block">
              <TopAuthors />
            </div>
          </div>
        </div>

        {/* Right — content tabs */}
        <div className="min-w-0 flex-1">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'published' && (
            <PublicArticleList
              initialArticles={articles}
              initialMeta={articlesMeta}
              authorSlug={author.slug}
            />
          )}

          {activeTab === 'liked' && isOwner && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500">Belum ada artikel yang disukai</p>
              <Link href="/" className="mt-3 inline-block text-xs text-primary hover:underline">Jelajahi Berita</Link>
            </div>
          )}

          {activeTab === 'comments' && isOwner && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500">Belum ada komentar</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile only — Top 10 sections appear AFTER articles */}
      <div className="mt-6 space-y-4 lg:hidden">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <MiniLeaderboard />
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <TopAuthors />
        </div>
      </div>
    </section>
  )
}

/** Public article list — artikel server-rendered + "Muat lebih banyak" (paging) */
function PublicArticleList({
  initialArticles,
  initialMeta,
  authorSlug,
}: {
  initialArticles: Article[]
  initialMeta?: ArticlesMeta | null
  authorSlug: string
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [page, setPage] = useState<number>(initialMeta?.current_page || 1)
  const [lastPage, setLastPage] = useState<number>(initialMeta?.last_page || 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const hasMore = page < lastPage

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)
    setError(false)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/authors/${encodeURIComponent(authorSlug)}/articles?page=${nextPage}`)
      if (!res.ok) throw new Error('failed')
      const json = (await res.json()) as { data: Article[]; meta: ArticlesMeta | null }
      // Dedupe berdasarkan id untuk jaga-jaga
      setArticles((prev) => {
        const seen = new Set(prev.map((a) => a.id))
        return [...prev, ...json.data.filter((a) => !seen.has(a.id))]
      })
      setPage(json.meta?.current_page || nextPage)
      if (json.meta?.last_page) setLastPage(json.meta.last_page)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!articles.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">Belum ada artikel yang dipublish</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/${article.category?.slug || 'berita'}/${article.slug}`}
          className="flex gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
            <Image src={getImageUrl(article.thumbnail_url)} alt={article.thumbnail_alt || article.title} fill className="object-cover" sizes="144px" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">{article.title}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-gray-500">{article.excerpt}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
              {article.category && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${article.category.color || '#E53935'}20`, color: article.category.color || '#E53935' }}>
                  {article.category.name}
                </span>
              )}
              <span>{formatDate(article.published_at)}</span>
              {article.views !== undefined && <span>{article.views.toLocaleString('id-ID')} views</span>}
            </div>
          </div>
        </Link>
      ))}

      {/* Muat lebih banyak */}
      {hasMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            {loading ? 'Memuat…' : 'Muat lebih banyak'}
          </button>
          {error && (
            <p className="mt-2 text-xs text-red-600">Gagal memuat artikel. Coba lagi.</p>
          )}
        </div>
      )}
    </div>
  )
}

/** Mini leaderboard — top 10 by points */
function MiniLeaderboard() {
  const [entries, setEntries] = useState<{ rank: number; author: { name: string; slug: string; avatar_url: string | null }; total_points: number; level: { badge_color: string } }[]>([])

  useEffect(() => {
    fetch('/api/leaderboard?sort=total_points&limit=10')
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.data) setEntries(res.data) })
      .catch(() => {})
  }, [])

  if (!entries.length) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">🏆 Top Kontributor</h3>
        <Link href="/leaderboard" className="text-[10px] text-primary hover:underline">Lihat semua</Link>
      </div>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <Link
            key={entry.rank}
            href={`/profile/${entry.author.slug}`}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              entry.rank <= 3 ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
            }`}>
              {entry.rank}
            </span>
            <Image
              src={getImageUrl(entry.author.avatar_url)}
              alt={entry.author.name}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
              unoptimized
            />
            <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">{entry.author.name}</span>
            <span className="text-[10px] font-medium" style={{ color: entry.level.badge_color }}>{entry.total_points.toLocaleString('id-ID')}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
