'use client'

import { useEffect } from 'react'

interface SocialProofProps {
  slug: string
  initialViews?: number
}

export function SocialProof({ slug, initialViews = 0 }: SocialProofProps) {
  // Track view (fire & forget)
  useEffect(() => {
    if (!slug) return
    fetch(`/api/articles/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: typeof window !== 'undefined' ? (sessionStorage.getItem('sid') || (() => {
          const id = Math.random().toString(36).slice(2)
          sessionStorage.setItem('sid', id)
          return id
        })()) : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }),
    }).catch(() => {})
  }, [slug])

  if (!initialViews || initialViews <= 0) return null

  const formatted = initialViews >= 1000 ? `${(initialViews / 1000).toFixed(1)}k` : initialViews.toString()

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>{formatted} orang membaca ini</span>
    </div>
  )
}
