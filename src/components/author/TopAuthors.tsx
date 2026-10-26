'use client'

import { useState, useEffect } from 'react'
import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { getImageUrl } from '@/lib/api'

interface TopAuthor {
  id: number
  name: string
  slug: string
  avatar_url: string | null
  verified?: boolean
  article_count?: number
}

export function TopAuthors() {
  const [authors, setAuthors] = useState<TopAuthor[]>([])

  useEffect(() => {
    fetch('/api/authors?sort=most_articles&limit=10')
      .then(res => res.json())
      .then(data => setAuthors(data?.data || []))
      .catch(() => {})
  }, [])

  if (!authors.length) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">✍️ Penulis Aktif</h3>
        <Link href="/leaderboard" className="text-[10px] text-primary hover:underline">Lihat semua</Link>
      </div>
      <div className="space-y-1.5">
        {authors.map((author, idx) => (
          <Link
            key={author.id}
            href={`/profile/${author.slug}`}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              idx < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
            }`}>
              {idx + 1}
            </span>
            <Image
              src={getImageUrl(author.avatar_url, { width: 48 })}
              alt={author.name}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
              unoptimized
            />
            <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
              {author.name}
            </span>
            <span className="text-[10px] text-gray-400">
              {author.article_count || 0} artikel
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
