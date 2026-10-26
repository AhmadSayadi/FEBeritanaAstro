'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/compat/navigation'
import Link from '@/compat/Link'
import { getImageUrl } from '@/lib/api'

interface Suggestion {
  type: 'article' | 'tag' | 'category'
  title?: string
  name?: string
  slug: string
  category_slug?: string
  thumbnail_url?: string
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.data || [])
        setOpen(true)
      } catch {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push(`/pencarian?q=${encodeURIComponent(query.trim())}`)
  }

  const getSuggestionUrl = (item: Suggestion): string => {
    if (item.type === 'article') {
      return `/${item.category_slug || 'berita'}/${item.slug}`
    }
    if (item.type === 'category') return `/kategori/${item.slug}`
    return `/tag/${item.slug}`
  }

  return (
    <div ref={ref} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          aria-label="Cari berita"
          placeholder="Cari berita..."
          autoComplete="off"
          autoFocus
          className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button type="submit" className="btn-primary">Cari</button>
      </form>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {suggestions.map((item, i) => (
            <Link
              key={i}
              href={getSuggestionUrl(item)}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => { setOpen(false); setQuery('') }}
            >
              {/* Thumbnail */}
              {item.thumbnail_url && (
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(item.thumbnail_url, { width: 128 })}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className={`mb-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  item.type === 'article' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  item.type === 'category' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                }`}>
                  {item.type === 'article' ? 'Artikel' : item.type === 'category' ? 'Kategori' : 'Tag'}
                </span>
                <p className="truncate text-gray-700 dark:text-gray-300">{item.title || item.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
