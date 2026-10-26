'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TrendingKeyword {
  keyword: string
  slug: string
  count?: number
}

export function TrendingBar({ initialData }: { initialData?: { keyword: string; slug: string; count?: number }[] }) {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>(initialData || [])
  const [loading, setLoading] = useState(!(initialData && initialData.length > 0))

  useEffect(() => {
    if (initialData && initialData.length > 0) return // Already have data from SSR
    fetch('/api/trending-keywords')
      .then(res => res.json())
      .then(data => setKeywords((data?.data || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialData])

  // Reserve height while the first fetch is pending (prevents CLS).
  if (!keywords.length && loading) {
    return <div className="container-main py-2" aria-hidden="true"><div className="h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800/40" /></div>
  }
  if (!keywords.length) return null

  return (
    <div className="container-main py-2">
      <div className="flex items-center gap-3 rounded-xl bg-primary-dark px-4 py-2.5 dark:bg-primary-dark">
        <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          Trending Tag
        </span>
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            {keywords.map((kw) => (
              <Link
                key={kw.slug}
                href={`/tag/${kw.slug}`}
                className="shrink-0 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-black/40"
              >
                {kw.keyword}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
