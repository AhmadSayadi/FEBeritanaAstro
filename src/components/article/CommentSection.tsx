'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getCurrentUser, getToken, isLoggedIn } from '@/lib/auth'
import Link from 'next/link'

interface CommentUser {
  id?: number
  name: string
  avatar_url: string | null
}

interface Comment {
  id: number
  user: CommentUser
  content: string
  likes_count: number
  is_liked?: boolean
  created_at: string
}

interface CommentSectionProps {
  slug: string
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  return `${diffDays} hari lalu`
}

function getAvatar(url: string | null | undefined, name: string): string {
  if (url && url.startsWith('http')) return url
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E53935&color=fff&size=40`
}

export function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Load comments from API
  useEffect(() => {
    setLoading(true)
    fetch(`/api/comments/${slug}`)
      .then(res => res.json())
      .then(data => {
        const list = data?.data || []
        setComments(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!isLoggedIn()) {
      setErrorMsg('Anda harus login untuk berkomentar')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const token = getToken()
      const res = await fetch(`/api/comments/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        const data = await res.json()
        const newC = data?.data || data
        // Selalu isi user dari currentUser bila BE tidak mengembalikannya,
        // supaya komentar langsung tampil dengan nama & avatar yang benar
        // (bukan "Anonim") tanpa perlu refresh.
        const me = getCurrentUser()
        const optimistic: Comment = {
          id: newC?.id ?? Date.now(),
          content: newC?.content ?? newComment,
          likes_count: newC?.likes_count ?? 0,
          is_liked: newC?.is_liked ?? false,
          created_at: newC?.created_at ?? new Date().toISOString(),
          user: {
            id: newC?.user?.id ?? me?.id,
            name: newC?.user?.name ?? me?.name ?? 'Anonim',
            avatar_url: newC?.user?.avatar_url ?? me?.avatar_url ?? null,
          },
        }
        setComments(prev => [optimistic, ...prev])
        setNewComment('')
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.message || 'Gagal mengirim komentar')
      }
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server')
    } finally {
      setSubmitting(false)
    }
  }

  const currentUser = getCurrentUser()

  return (
    <div className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-700">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Komentar ({comments.length})
      </h2>

      {/* Comment form — only show if logged in */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis komentar..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label="Tulis komentar"
          />
          {errorMsg && <p className="mt-1 text-xs text-red-500">{errorMsg}</p>}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Komentar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <Link href="/masuk" className="font-medium text-primary hover:underline">Login</Link> untuk meninggalkan komentar.
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada komentar. Jadilah yang pertama!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Image
                src={getAvatar(comment.user?.avatar_url, comment.user?.name || 'User')}
                alt={comment.user?.name || 'User'}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full"
                unoptimized
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.user?.name || 'Anonim'}</span>
                  <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button aria-label="Suka komentar" className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {comment.likes_count > 0 && comment.likes_count}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
