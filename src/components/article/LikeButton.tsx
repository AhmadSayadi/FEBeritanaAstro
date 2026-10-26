'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, isLoggedIn } from '@/lib/auth'

interface LikeButtonProps {
  slug: string
  initialLikes?: number
  initialLiked?: boolean
}

export function LikeButton({ slug, initialLikes = 0, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialLikes)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Sinkron status "liked" per-user dari server saat mount.
  // SSR tidak tahu user login (auth via token di client), jadi initialLiked
  // dari server hampir selalu false. Ambil status akurat di sini.
  // Catatan: JANGAN reset state dari initialLiked di useEffect terpisah —
  // itu akan menimpa optimistic update dan bikin like "hilang" sampai refresh.
  useEffect(() => {
    if (!isLoggedIn()) return
    const token = getToken()
    fetch(`/api/articles/${slug}/like-status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && typeof data.is_liked === 'boolean') setLiked(data.is_liked)
        if (data && typeof data.likes_count === 'number') setCount(data.likes_count)
      })
      .catch(() => {})
  }, [slug])

  const handleLike = async () => {
    if (!isLoggedIn()) {
      router.push('/masuk')
      return
    }
    if (loading) return

    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setCount(prev => newLiked ? prev + 1 : prev - 1)
    setLoading(true)

    try {
      const token = getToken()
      const res = await fetch(`/api/articles/${slug}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.is_liked === 'boolean') setLiked(data.is_liked)
        if (typeof data.likes_count === 'number') setCount(data.likes_count)
      } else {
        // Rollback
        setLiked(!newLiked)
        setCount(prev => newLiked ? prev - 1 : prev + 1)
      }
    } catch {
      setLiked(!newLiked)
      setCount(prev => newLiked ? prev - 1 : prev + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      aria-label={liked ? 'Batal suka' : 'Suka artikel ini'}
      aria-pressed={liked}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        liked
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-400'
      }`}
    >
      <svg className={`h-4 w-4 ${liked ? 'fill-primary' : ''}`} fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
