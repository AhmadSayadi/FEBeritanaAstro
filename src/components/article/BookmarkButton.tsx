'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/compat/navigation'
import { getToken, isLoggedIn } from '@/lib/auth'

interface BookmarkButtonProps {
  slug: string
  initialBookmarked?: boolean
}

export function BookmarkButton({ slug, initialBookmarked = false }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Sync with server bookmark status if user is logged in
    if (!isLoggedIn()) return

    const token = getToken()
    fetch(`/api/articles/${slug}/bookmark-status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.is_bookmarked === 'boolean') {
          setSaved(data.is_bookmarked)
        }
      })
      .catch(() => {})
  }, [slug])

  const handleBookmark = async () => {
    if (!isLoggedIn()) {
      router.push('/masuk')
      return
    }
    if (loading) return

    const newSaved = !saved
    setSaved(newSaved)
    setLoading(true)

    try {
      const token = getToken()
      const res = await fetch(`/api/bookmarks/${slug}`, {
        method: newSaved ? 'POST' : 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) {
        setSaved(!newSaved)
      }
    } catch {
      setSaved(!newSaved)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={loading}
      aria-label={saved ? 'Hapus dari bookmark' : 'Simpan artikel'}
      aria-pressed={saved}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        saved
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-400'
      }`}
    >
      <svg className={`h-4 w-4 ${saved ? 'fill-primary' : ''}`} fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? 'Tersimpan' : 'Simpan'}
    </button>
  )
}
