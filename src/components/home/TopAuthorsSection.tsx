'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Author {
  id: number
  name: string
  slug: string
  avatar_url: string | null
  verified?: boolean
  article_count?: number
}

export function TopAuthorsSection({ initialData }: { initialData?: Author[] }) {
  const [authors, setAuthors] = useState<Author[]>(initialData || [])
  const [loading, setLoading] = useState(!(initialData && initialData.length > 0))

  useEffect(() => {
    if (initialData && initialData.length > 0) return
    fetch('/api/authors?sort=most_articles&limit=5')
      .then(res => res.json())
      .then(data => setAuthors(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialData])

  // Reserve height while the first fetch is pending (prevents CLS).
  if (!authors.length && loading) {
    return <section className="container-main py-8" aria-hidden="true"><div className="h-[180px] rounded-xl bg-gray-100 dark:bg-gray-800/40" /></section>
  }
  if (!authors.length) return null

  return (
    <section className="container-main py-8">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <span className="inline-block h-5 w-1 bg-primary" aria-hidden="true" />
        Penulis Populer
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {authors.map((author) => (
          <Link
            key={author.id}
            href={`/profile/${author.slug}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            style={{ width: '140px' }}
          >
            <Image
              src={author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=E53935&color=fff&size=80`}
              alt={author.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
              unoptimized
            />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="line-clamp-1 text-xs font-bold text-gray-900 dark:text-white">{author.name}</span>
                {author.verified && (
                  <svg className="h-3.5 w-3.5 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-[11px] text-gray-500">{author.article_count || 0} artikel</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
