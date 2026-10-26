'use client'

import { useState, useEffect, useCallback } from 'react'
import { Article } from '@/lib/types'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { DatePicker } from '@/components/ui/DatePicker'

interface CategoryOption {
  name: string
  slug: string
}

export function BeritaIndexPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  // Filters
  const [sort, setSort] = useState<'latest' | 'popular' | 'oldest'>('latest')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Debounce search input -> search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch categories for filter
  useEffect(() => {
    fetch('/api/categories-list')
      .then(r => r.json())
      .then(data => {
        if (data?.data) setCategories(data.data.map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug })))
      })
      .catch(() => {})
  }, [])

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '12')
      params.set('sort', sort)
      if (category) params.set('category', category)
      if (date) params.set('date', date)
      if (search) params.set('search', search)

      const res = await fetch(`/api/articles?${params.toString()}`)
      const data = await res.json()
      setArticles(data?.data || [])
      setTotalPages(data?.meta?.last_page || 1)
    } catch {
      setArticles([])
    }
    setLoading(false)
  }, [page, sort, category, date, search])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [sort, category, date, search])

  // Today's date as default for date picker
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Breadcrumb items={[{ name: 'Indeks Berita' }]} />

      <section className="container-main pb-12">
        {/* Header */}
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Indeks Berita</h1>

        {/* Filters */}
        <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search - full width on mobile, flexible on desktop */}
          <div className="relative w-full flex-1 sm:min-w-[240px]">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari berita..."
              className="w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'latest' | 'popular' | 'oldest')}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="latest">Terbaru</option>
            <option value="popular">Terpopuler</option>
            <option value="oldest">Terlama</option>
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">Semua Kanal</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* Date */}
          <DatePicker
            value={date}
            max={today}
            onChange={(v) => setDate(v)}
            placeholder="Pilih tanggal"
          />

          {/* Clear filter */}
          {(category || date || sort !== 'latest' || search) && (
            <button
              onClick={() => { setSort('latest'); setCategory(''); setDate(''); setSearchInput('') }}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-primary hover:text-primary"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="mt-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} size="medium" />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500">Tidak ada berita ditemukan.</p>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
            {/* Previous */}
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              aria-label="Halaman sebelumnya"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = page <= 4 ? i + 1 : Math.min(page + i - 3, totalPages)
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors ${
                    p === page ? 'bg-primary font-semibold text-white' : 'border border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                  }`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            })}

            {/* Next */}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              aria-label="Halaman berikutnya"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Last */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              aria-label="Halaman terakhir"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </nav>
        )}
      </section>
    </>
  )
}
