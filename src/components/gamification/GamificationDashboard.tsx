'use client'

import { useState, useEffect } from 'react'
import { getToken } from '@/lib/auth'

interface GamProfile {
  total_points: number
  level: { number: number; name: string; badge_name: string; badge_color: string }
  next_level: { number: number; name: string; min_points: number; points_needed: number; progress: number }
  reputation_score: number
  streak: { daily: number; weekly: number; longest: number }
  stats: { articles: number; videos: number; photos: number; views: number; trending: number; featured: number }
  leaderboard_rank: number
  is_paid_writer: boolean
}

interface Badge {
  id: number; name: string; slug: string; color: string; icon?: string | null
  description: string; unlocked_at?: string
}

interface Mission {
  id: number; name: string; description?: string | null; type: string
  condition_value: number; progress: number; completed: boolean
  reward_points: number; reward_reputation: number
}

interface PointEntry {
  points: number; type: string; description: string; created_at: string
}

interface WalletData {
  is_paid_writer: boolean; total_earnings: number
  pending_earnings: number; withdrawn_earnings: number
}

export function GamificationDashboard() {
  const [profile, setProfile] = useState<GamProfile | null>(null)
  const [badges, setBadges] = useState<{ earned: Badge[]; available: Badge[] }>({ earned: [], available: [] })
  const [missions, setMissions] = useState<Mission[]>([])
  const [points, setPoints] = useState<PointEntry[]>([])
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    const headers = { 'Authorization': `Bearer ${token}` }

    Promise.all([
      fetch('/api/author/gamification/profile', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/author/gamification/badges', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/author/gamification/missions', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/author/gamification/points?limit=10', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/author/gamification/wallet', { headers }).then(r => r.ok ? r.json() : null),
    ])
      .then(([prof, bdg, mis, pts, wal]) => {
        if (prof?.data) setProfile(prof.data)
        if (bdg) setBadges({ earned: bdg.earned || [], available: bdg.available || [] })
        if (mis?.data) setMissions(mis.data)
        if (pts?.data) setPoints(pts.data)
        if (wal?.data) setWallet(wal.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">Data pencapaian belum tersedia</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Level & Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: profile.level.badge_color }}
            >
              {profile.level.number}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{profile.level.name}</h3>
              <p className="text-xs text-gray-500">
                <span className="font-medium" style={{ color: profile.level.badge_color }}>{profile.level.badge_name}</span>
                {' · '}{profile.total_points.toLocaleString('id-ID')} poin
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">#{profile.leaderboard_rank}</p>
            <p className="text-[11px] text-gray-500">Peringkat</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>Level {profile.level.number}</span>
            <span>Level {profile.next_level.number} · {profile.next_level.name}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${profile.next_level.progress}%`, backgroundColor: profile.level.badge_color }}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-400">{profile.next_level.points_needed.toLocaleString('id-ID')} poin lagi</p>
        </div>
      </div>

      {/* Streak & Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Streak" value={`🔥 ${profile.streak.daily}`} sub={`Terpanjang: ${profile.streak.longest} hari`} />
        <StatCard label="Artikel" value={String(profile.stats.articles)} />
        <StatCard label="Views" value={formatNumber(profile.stats.views)} />
        <StatCard label="Trending" value={String(profile.stats.trending)} />
      </div>

      {/* Missions */}
      {missions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Misi Aktif</h3>
          <div className="space-y-3">
            {missions.filter(m => !m.completed).slice(0, 5).map((mission) => (
              <div key={mission.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{mission.name}</p>
                    <span className="shrink-0 text-[11px] text-gray-400">+{mission.reward_points} poin</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((mission.progress / mission.condition_value) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-400">{mission.progress}/{mission.condition_value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.earned.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Badge Diraih</h3>
          <div className="flex flex-wrap gap-2">
            {badges.earned.map((badge) => (
              <span
                key={badge.id}
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: badge.color }}
                title={badge.description}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Badges */}
      {badges.available.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Badge Tersedia</h3>
          <div className="space-y-2">
            {badges.available.slice(0, 6).map((badge) => (
              <div key={badge.id} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full opacity-40" style={{ backgroundColor: badge.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{badge.name}</span>
                <span className="text-[10px] text-gray-400">— {badge.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet (paid writer only) */}
      {wallet?.is_paid_writer && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Pendapatan</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">Rp {formatNumber(wallet.total_earnings)}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-600">Rp {formatNumber(wallet.pending_earnings)}</p>
              <p className="text-[10px] text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Rp {formatNumber(wallet.withdrawn_earnings)}</p>
              <p className="text-[10px] text-gray-500">Dicairkan</p>
            </div>
          </div>
        </div>
      )}

      {/* Point History */}
      {points.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Riwayat Poin</h3>
          <div className="space-y-2">
            {points.map((entry, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 dark:border-gray-700">
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{entry.description}</p>
                  <p className="text-[10px] text-gray-400">{entry.created_at}</p>
                </div>
                <span className={`text-sm font-bold ${entry.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                  {entry.type === 'earn' ? '+' : '-'}{entry.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800">
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
      {sub && <p className="mt-0.5 text-[9px] text-gray-400">{sub}</p>}
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toLocaleString('id-ID')
}
