'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/lib/api'

type ViewType = 'points' | 'badges'
type SortType = 'total_points' | 'total_views' | 'reputation_score' | 'trending_count' | 'articles_count'

interface LeaderboardEntry {
  rank: number
  author: { name: string; slug: string; avatar_url: string | null; verified: boolean }
  total_points: number
  level: { number: number; name: string; badge_name: string; badge_color: string }
  stats: { articles: number; views: number; trending: number; featured: number }
  reputation: number
  streak: number
  badges_count: number
}

interface BadgeRankEntry {
  rank: number
  author: { name: string; slug: string; avatar_url: string | null; verified: boolean }
  badge_count: number
  badges: { name: string; slug: string; color: string; icon: string | null }[]
}

interface BadgeInfo {
  id: number; name: string; slug: string; description: string
  color: string; category: string; condition_type: string; condition_value: number
}

export function LeaderboardPage() {
  const [view, setView] = useState<ViewType>('points')
  const [sort, setSort] = useState<SortType>('total_points')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [badgeRanking, setBadgeRanking] = useState<BadgeRankEntry[]>([])
  const [allBadges, setAllBadges] = useState<BadgeInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch points leaderboard
  useEffect(() => {
    if (view !== 'points') return
    setLoading(true)
    fetch(`/api/leaderboard?sort=${sort}&limit=50`)
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.data) setData(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sort, view])

  // Fetch badges leaderboard
  useEffect(() => {
    if (view !== 'badges') return
    setLoading(true)
    fetch('/api/leaderboard/badges?limit=20')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.ranking) setBadgeRanking(res.ranking)
        if (res?.badges) setAllBadges(res.badges)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [view])

  const sortOptions: { id: SortType; label: string }[] = [
    { id: 'total_points', label: 'Poin' },
    { id: 'total_views', label: 'Views' },
    { id: 'articles_count', label: 'Artikel' },
    { id: 'reputation_score', label: 'Reputasi' },
    { id: 'trending_count', label: 'Trending' },
  ]

  return (
    <section className="container-main py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard Penulis</h1>
        <p className="mt-1 text-sm text-gray-500">Peringkat penulis berdasarkan performa dan pencapaian</p>
      </div>

      {/* View toggle */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setView('points')}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${view === 'points' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
          >
            Ranking
          </button>
          <button
            onClick={() => setView('badges')}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${view === 'badges' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
          >
            Badges
          </button>
        </div>

        {view === 'points' && (
          <div className="flex flex-wrap gap-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSort(opt.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  sort === opt.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex h-16 animate-pulse items-center gap-4 rounded-xl bg-gray-100 px-4 dark:bg-gray-800" />
          ))}
        </div>
      ) : view === 'points' ? (
        /* Points Leaderboard */
        <div className="space-y-2">
          {data.map((entry) => (
            <Link
              key={entry.rank}
              href={`/profile/${entry.author.slug}`}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                entry.rank <= 3 ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-900/10' : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                entry.rank === 1 ? 'bg-yellow-400 text-white' :
                entry.rank === 2 ? 'bg-gray-300 text-white' :
                entry.rank === 3 ? 'bg-orange-400 text-white' :
                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {entry.rank}
              </div>

              <Image
                src={getImageUrl(entry.author.avatar_url)}
                alt={entry.author.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.author.name}</p>
                  {entry.author.verified && (
                    <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  <span className="font-medium" style={{ color: isLightColor(entry.level.badge_color) ? '#6B7280' : entry.level.badge_color }}>{entry.level.badge_name}</span>
                  {' · '}{entry.level.name}
                  {entry.streak > 0 && ` · 🔥 ${entry.streak}`}
                </p>
                {/* Mobile stats — inline below name */}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 sm:hidden">
                  <span><span className="font-bold text-gray-900 dark:text-white">{entry.total_points.toLocaleString('id-ID')}</span> Poin</span>
                  <span><span className="font-bold text-gray-900 dark:text-white">{formatNum(entry.stats.views)}</span> Views</span>
                  <span><span className="font-bold text-gray-900 dark:text-white">{entry.stats.articles}</span> Artikel</span>
                </div>
              </div>

              <div className="hidden gap-6 text-center sm:flex">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.total_points.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-gray-400">Poin</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatNum(entry.stats.views)}</p>
                  <p className="text-[10px] text-gray-400">Views</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.stats.articles}</p>
                  <p className="text-[10px] text-gray-400">Artikel</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Badges Leaderboard */
        <div className="space-y-6">
          {/* Badge ranking */}
          <div className="space-y-2">
            {badgeRanking.map((entry) => (
              <Link
                key={entry.rank}
                href={`/profile/${entry.author.slug}`}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  entry.rank === 1 ? 'bg-yellow-400 text-white' :
                  entry.rank === 2 ? 'bg-gray-300 text-white' :
                  entry.rank === 3 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {entry.rank}
                </div>

                <Image
                  src={getImageUrl(entry.author.avatar_url)}
                  alt={entry.author.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  unoptimized
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.author.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.badges.slice(0, 5).map((badge, i) => (
                      <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: badge.color }}>
                        {badge.name}
                      </span>
                    ))}
                    {entry.badges.length > 5 && (
                      <span className="text-[10px] text-gray-400">+{entry.badges.length - 5}</span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{entry.badge_count}</p>
                  <p className="text-[10px] text-gray-400">Badge</p>
                </div>
              </Link>
            ))}
          </div>

          {/* All available badges */}
          {allBadges.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Semua Badge ({allBadges.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {allBadges.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: badge.color }}>
                      ★
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{badge.name}</p>
                      <p className="text-[11px] text-gray-500">{badge.description}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400 capitalize">{badge.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Syarat & Ketentuan */}
      <div className="mt-12 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Level & Badge System</h2>

        {/* Level System */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Writer Levels</h3>
          <div className="space-y-2">
            {[
              { level: 1, name: 'Newbie Writer', badge: 'Bronze', color: '#CD7F32', desc: 'Penulis Pemula' },
              { level: 2, name: 'Active Writer', badge: 'Silver', color: '#C0C0C0', desc: 'Penulis Aktif' },
              { level: 3, name: 'Rising Author', badge: 'Gold', color: '#FFD700', desc: 'Penulis Berkembang' },
              { level: 4, name: 'Top Contributor', badge: 'Platinum', color: '#E5E4E2', desc: 'Kontributor Utama' },
              { level: 5, name: 'Legendary Writer', badge: 'Diamond', color: '#B9F2FF', desc: 'Penulis Legendaris' },
            ].map((l) => (
              <div key={l.level} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: l.color }}>
                  {l.level}
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{l.name} <span className="text-gray-400">({l.desc})</span></p>
                  <p className="text-[10px] text-gray-400">{l.badge}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge List */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Badges</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: 'Fast Writer', desc: 'Publish 10 articles', descId: 'Penulis Cepat' },
              { name: 'Consistent Creator', desc: 'Publish 100 articles', descId: 'Penulis Konsisten' },
              { name: 'Trending Master', desc: '10 trending contents', descId: 'Raja Trending' },
              { name: 'Viral Article', desc: '100K total views', descId: 'Artikel Viral' },
              { name: 'Most Viewed Writer', desc: '1M total views', descId: 'Penulis Terpopuler' },
              { name: 'Rising Star', desc: 'Reach Level 2', descId: 'Bintang Baru' },
              { name: 'Top Creator', desc: 'Reach Level 4', descId: 'Kreator Unggulan' },
              { name: 'Legendary Contributor', desc: 'Reach Level 5', descId: 'Kontributor Legendaris' },
              { name: 'Streak Master', desc: '30 days streak', descId: 'Raja Konsistensi' },
              { name: 'Engagement King', desc: 'Reputation 500+', descId: 'Raja Engagement' },
              { name: 'Breaking News Hunter', desc: '5 featured articles', descId: 'Pemburu Breaking News' },
              { name: 'Top Weekly Writer', desc: '4 consecutive active weeks', descId: 'Penulis Mingguan Terbaik' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700">
                <span className="text-sm">🏅</span>
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{b.name}</p>
                  <p className="text-[10px] text-gray-400">{b.desc} — <span className="italic">{b.descId}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cara Mendapatkan Poin */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">How to Earn Points</h3>
          <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">+10</span> Publish article</li>
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">+30</span> Trending article</li>
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">+50</span> Featured article</li>
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">+5</span> Complete daily mission</li>
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">+20</span> Complete weekly mission</li>
            <li className="flex items-center gap-2"><span className="font-bold text-green-600">+1</span> Per 1,000 views</li>
          </ul>
          <p className="mt-3 text-[11px] text-gray-400">Points are accumulated to level up. Higher levels unlock more features and benefits.</p>
        </div>
      </div>
    </section>
  )
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toLocaleString('id-ID')
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.7
}
