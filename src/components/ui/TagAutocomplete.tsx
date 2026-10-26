'use client'

import { useState, useEffect, useRef } from 'react'

interface TagAutocompleteProps {
  tags: string[]
  onAdd: (tag: string) => void
}

interface TagSuggestion {
  id: number
  name: string
  slug: string
  article_count?: number
}

export function TagAutocomplete({ tags, onAdd }: TagAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/tags-list?q=${encodeURIComponent(query)}&sort=name&limit=10`)
        .then(res => res.json())
        .then(data => {
          const items = (data?.data || []).filter((t: TagSuggestion) => !tags.includes(t.name))
          setSuggestions(items)
          setOpen(items.length > 0)
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [query, tags])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSubmit = () => {
    const val = query.trim()
    if (val && !tags.includes(val)) {
      onAdd(val)
      setQuery('')
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Cari atau tambah tag baru..."
          aria-label="Cari atau tambah tag"
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!query.trim()}
          className="shrink-0 rounded bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Tambah
        </button>
      </div>

      {/* Dropdown suggestions */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onAdd(tag.name)
                setQuery('')
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
              {tag.article_count !== undefined && (
                <span className="text-[10px] text-gray-400">{tag.article_count} artikel</span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading && query.length >= 2 && (
        <div className="absolute right-12 top-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        </div>
      )}
    </div>
  )
}
