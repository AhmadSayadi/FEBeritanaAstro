'use client'

import { useState, useEffect, useRef } from 'react'
import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { useRouter } from '@/compat/navigation'
import { getCurrentUser, getToken, isLoggedIn, logout, User } from '@/lib/auth'
import { getImageUrl } from '@/lib/api'
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard'

type TabType = 'published' | 'liked' | 'comments' | 'pencapaian' | 'settings'

interface ProfileData {
  id: number
  name: string
  slug?: string
  email: string
  avatar_url: string
  bio?: string
  location?: string
  joined_at?: string
  role?: string
  verified?: boolean
  cover_color?: string
  social?: {
    twitter?: string
    instagram?: string
    facebook?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
  stats?: {
    total_articles?: number
    total_likes?: number
    total_comments?: number
  }
}

export function ProfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('published')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [coverColor, setCoverColor] = useState('#E53935')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/masuk')
      return
    }
    const localUser = getCurrentUser()
    setUser(localUser)

    // Fetch full profile from API
    const token = getToken()
    fetch('/api/author/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data) setProfile(data.data)
        else if (data?.id) setProfile(data)
      })
      .catch(() => {})
  }, [router])

  // Sync cover color when profile loads
  useEffect(() => {
    if (profile?.cover_color) setCoverColor(profile.cover_color)
  }, [profile])

  if (!user) {
    return (
      <div className="container-main flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    )
  }

  const data = profile || {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role,
    verified: user.verified,
    cover_color: '#E53935',
  } as ProfileData

  const tabs: { id: TabType; label: string }[] = [
    { id: 'published', label: 'Artikel' },
    { id: 'pencapaian', label: 'Pencapaian' },
    { id: 'liked', label: 'Disukai' },
    { id: 'comments', label: 'Komentar' },
    { id: 'settings', label: 'Settings' },
  ]

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg('')

    const formData = new FormData(e.currentTarget)
    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      bio: formData.get('bio'),
      location: formData.get('location'),
      cover_color: formData.get('cover_color'),
      social: {
        twitter: formData.get('social_twitter') || '',
        instagram: formData.get('social_instagram') || '',
        facebook: formData.get('social_facebook') || '',
        linkedin: formData.get('social_linkedin') || '',
        youtube: formData.get('social_youtube') || '',
        tiktok: formData.get('social_tiktok') || '',
        website: formData.get('social_website') || '',
      },
    }

    try {
      const token = getToken()
      const res = await fetch('/api/author/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        if (updated?.data) {
          setProfile(updated.data)
          // Update localStorage so data persists on refresh
          const currentUser = JSON.parse(localStorage.getItem('beritana_user') || '{}')
          localStorage.setItem('beritana_user', JSON.stringify({
            ...currentUser,
            name: updated.data.name || currentUser.name,
            email: updated.data.email || currentUser.email,
            avatar_url: updated.data.avatar_url || currentUser.avatar_url,
          }))
        }
        setProfileMsg('Profil berhasil disimpan')
      } else {
        const err = await res.json().catch(() => ({}))
        setProfileMsg(err.message || 'Gagal menyimpan profil')
      }
    } catch {
      setProfileMsg('Tidak dapat terhubung ke server')
    } finally {
      setSavingProfile(false)
    }
  }

  const formatJoined = (date?: string) => {
    if (!date) return '-'
    try {
      return new Date(date).getFullYear()
    } catch {
      return date
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarMsg('Format harus JPG, PNG, atau WebP')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg('Ukuran maksimal 2 MB')
      return
    }

    setUploadingAvatar(true)
    setAvatarMsg('')

    try {
      const token = getToken()
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/author/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.data?.avatar_url) {
        const newUrl = data.data.avatar_url
        setProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : prev))
        // Update localStorage so header avatar refreshes too
        const cached = JSON.parse(localStorage.getItem('beritana_user') || '{}')
        localStorage.setItem('beritana_user', JSON.stringify({ ...cached, avatar_url: newUrl }))
        setUser((prev) => (prev ? { ...prev, avatar_url: newUrl } : prev))
        setAvatarMsg('Foto profil berhasil diperbarui')
      } else {
        setAvatarMsg(data?.message || 'Gagal mengunggah foto')
      }
    } catch {
      setAvatarMsg('Tidak dapat terhubung ke server')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="container-main pb-12">
      {/* Cover + Avatar */}
      <div className="relative mb-16">
        <div className="h-32 rounded-b-xl sm:h-44" style={{ background: `linear-gradient(135deg, ${coverColor}, ${coverColor}cc)` }} />
        <div className="absolute -bottom-12 left-6 sm:left-8">
          <div className="relative">
            <Image
              src={getImageUrl(data.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=E53935&color=fff&size=200`}
              alt={data.name}
              width={100}
              height={100}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-28 sm:w-28"
              unoptimized
            />

            {/* Upload overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Ubah foto profil"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md transition-transform hover:scale-105 disabled:opacity-60 sm:h-9 sm:w-9"
            >
              {uploadingAvatar ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {avatarMsg && (
            <p className={`mt-2 text-[11px] font-medium ${avatarMsg.includes('berhasil') ? 'text-green-600' : 'text-red-500'}`}>
              {avatarMsg}
            </p>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{data.name}</h1>
                {data.verified && (
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {data.role && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold capitalize text-primary">{data.role}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{data.email}</p>
              {data.slug && (
                <Link
                  href={`/profile/${data.slug}`}
                  className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                >
                  Lihat profil publik →
                </Link>
              )}
              {data.bio && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{data.bio}</p>}
            </div>

            <div className="space-y-1.5 text-xs text-gray-500">
              {data.location && (
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {data.location}
                </p>
              )}
              {data.joined_at && (
                <p className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Bergabung {formatJoined(data.joined_at)}
                </p>
              )}
            </div>

            {/* Social icons */}
            <SocialIcons social={data.social} />

            {data.stats && (
              <div className="space-y-1 border-t border-gray-100 pt-3 dark:border-gray-700">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">TOTAL NEWS</span>
                  <span className="font-bold text-gray-900 dark:text-white">{data.stats.total_articles ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">TOTAL LIKES</span>
                  <span className="font-bold text-gray-900 dark:text-white">{data.stats.total_likes ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">TOTAL COMMENTS</span>
                  <span className="font-bold text-gray-900 dark:text-white">{data.stats.total_comments ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Artikel (semua status) */}
          {activeTab === 'published' && (
            <MyArticleList status="all" />
          )}

          {/* Pencapaian */}
          {activeTab === 'pencapaian' && (
            <GamificationDashboard />
          )}

          {/* Liked */}
          {activeTab === 'liked' && (
            <MyLikedList />
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            <MyCommentsList />
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleProfileSubmit} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-5 text-sm font-bold text-gray-900 dark:text-white">Pengaturan Profil</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="set-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
                  <input id="set-name" name="name" type="text" defaultValue={data.name} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>

                <div>
                  <label htmlFor="set-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input id="set-email" name="email" type="email" defaultValue={data.email} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>

                <div>
                  <label htmlFor="set-bio" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bio / Deskripsi</label>
                  <textarea id="set-bio" name="bio" rows={3} defaultValue={data.bio || ''} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>

                <div>
                  <label htmlFor="set-location" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi</label>
                  <input id="set-location" name="location" type="text" defaultValue={data.location || ''} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>

                <div>
                  <label htmlFor="set-cover-color" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Warna Cover</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="set-cover-color"
                      name="cover_color"
                      type="color"
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-xs text-gray-500">{coverColor}</span>
                    <span className="text-[11px] text-gray-400">Live preview di atas ↑</span>
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
                  <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Sosial Media</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="set-twitter" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter / X
                      </label>
                      <input id="set-twitter" name="social_twitter" type="text" placeholder="username" defaultValue={data.social?.twitter || ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="set-instagram" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram
                      </label>
                      <input id="set-instagram" name="social_instagram" type="text" placeholder="username" defaultValue={data.social?.instagram || ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="set-facebook" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </label>
                      <input id="set-facebook" name="social_facebook" type="text" placeholder="username atau URL" defaultValue={data.social?.facebook || ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="set-linkedin" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </label>
                      <input id="set-linkedin" name="social_linkedin" type="text" placeholder="username" defaultValue={data.social?.linkedin || ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="set-tiktok" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                        TikTok
                      </label>
                      <input id="set-tiktok" name="social_tiktok" type="text" placeholder="username" defaultValue={data.social?.tiktok || ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="set-website" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                        Website
                      </label>
                      <input id="set-website" name="social_website" type="url" placeholder="https://..." defaultValue={data.social?.website || ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {profileMsg && (
                <p className={`mt-4 text-xs ${profileMsg.includes('berhasil') ? 'text-green-600' : 'text-red-500'}`}>
                  {profileMsg}
                </p>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={async () => { await logout(); router.push('/') }}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Keluar dari Akun
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary px-6 disabled:opacity-50">
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Social Icons Component ──────────────────────────────────

const SOCIAL_META: Record<string, { icon: React.ReactNode; baseUrl?: string }> = {
  twitter: {
    icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    baseUrl: 'https://x.com/',
  },
  instagram: {
    icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    baseUrl: 'https://instagram.com/',
  },
  facebook: {
    icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    baseUrl: 'https://facebook.com/',
  },
  linkedin: {
    icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    baseUrl: 'https://linkedin.com/in/',
  },
  youtube: {
    icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    baseUrl: 'https://youtube.com/@',
  },
  tiktok: {
    icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
    baseUrl: 'https://tiktok.com/@',
  },
  website: {
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
  },
}

function getSocialHref(key: string, value: string): string {
  if (!value) return '#'
  if (value.startsWith('http')) return value
  const meta = SOCIAL_META[key]
  if (meta?.baseUrl) return `${meta.baseUrl}${value}`
  return value
}

function SocialIcons({ social }: { social?: ProfileData['social'] }) {
  if (!social) return null
  const links = Object.entries(social).filter(([, val]) => val && val.trim() !== '' && val !== '#')
  if (!links.length) return null

  return (
    <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
      {links.map(([key, val]) => {
        const meta = SOCIAL_META[key]
        if (!meta || !val) return null
        return (
          <a
            key={key}
            href={getSocialHref(key, val)}
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
  )
}

// ─── My Article List (fetches from authenticated API) ────────

interface ArticleItem {
  id: number
  title: string
  slug: string
  excerpt?: string
  thumbnail_url?: string
  status?: string
  published_at?: string
  category?: { name: string; slug: string; color?: string }
}

function MyArticleList({ status }: { status: 'all' | 'draft' | 'pending' }) {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('beritana_token')
    if (!token) { setLoading(false); return }

    fetch(`/api/author/articles?status=${status}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data) setArticles(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex animate-pulse gap-4 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
            <div className="h-20 w-28 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!articles.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">
          {status === 'draft' ? 'Belum ada draft artikel' : 'Belum ada artikel'}
        </p>
        <Link href="/tulis" className="btn-primary mt-3 inline-block text-xs">Tulis Artikel Baru</Link>
      </div>
    )
  }

  const formatDate = (d?: string) => {
    if (!d) return 'Belum dipublish'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const statusBadge = (s?: string) => {
    switch (s) {
      case 'published': return <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Published</span>
      case 'draft': return <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">Draft</span>
      case 'pending': return <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">Pending</span>
      default: return null
    }
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/tulis?edit=${article.id}`}
          className="flex gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
            <Image
              src={getImageUrl(article.thumbnail_url || null)}
              alt={article.title}
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">{article.title}</h3>
              {statusBadge(article.status)}
            </div>
            {article.excerpt && <p className="mt-1 line-clamp-1 text-xs text-gray-500">{article.excerpt}</p>}
            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
              {article.category && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${article.category.color || '#E53935'}20`, color: article.category.color || '#E53935' }}>
                  {article.category.name}
                </span>
              )}
              <span>{formatDate(article.published_at)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── My Liked Articles ───────────────────────────────────────
// Fetch artikel yang di-like user. BE: GET /author/liked
// -> { data: [{ id, title, slug, thumbnail_url, category, published_at }] }

function MyLikedList() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('beritana_token')
    if (!token) { setLoading(false); return }

    fetch('/api/author/liked', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data) setArticles(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex animate-pulse gap-4 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
            <div className="h-20 w-28 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!articles.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">Belum ada artikel yang disukai</p>
        <Link href="/" className="mt-3 inline-block text-xs text-primary hover:underline">Jelajahi Berita</Link>
      </div>
    )
  }

  const formatDate = (d?: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/${article.category?.slug || 'berita'}/${article.slug}`}
          className="flex gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
            <Image
              src={getImageUrl(article.thumbnail_url || null)}
              alt={article.title}
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">{article.title}</h3>
            {article.excerpt && <p className="mt-1 line-clamp-1 text-xs text-gray-500">{article.excerpt}</p>}
            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
              {article.category && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${article.category.color || '#E53935'}20`, color: article.category.color || '#E53935' }}>
                  {article.category.name}
                </span>
              )}
              <span>{formatDate(article.published_at)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── My Comments ─────────────────────────────────────────────
// Fetch komentar user. BE: GET /author/comments
// -> { data: [{ id, content, created_at, article: { title, slug, category } }] }

interface MyCommentItem {
  id: number
  content: string
  created_at?: string
  article?: { title: string; slug: string; category?: { slug: string } }
}

function MyCommentsList() {
  const [comments, setComments] = useState<MyCommentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('beritana_token')
    if (!token) { setLoading(false); return }

    fetch('/api/author/comments', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data) setComments(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-100 p-4 dark:border-gray-700">
            <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    )
  }

  if (!comments.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">Belum ada komentar</p>
      </div>
    )
  }

  const formatDate = (d?: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
            {c.article && (
              <Link
                href={`/${c.article.category?.slug || 'berita'}/${c.article.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {c.article.title}
              </Link>
            )}
            {c.created_at && <span>· {formatDate(c.created_at)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
