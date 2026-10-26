'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from '@/compat/Image'
import { getImageUrl, getBlurProps } from '@/lib/api'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

interface EkoranItem {
  id: number
  title: string
  slug: string
  cover_url: string
  date: string
  views?: number
}

export function EkoranListPage() {
  const [items, setItems] = useState<EkoranItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  // Viewer
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ekoran?page=${page}&per_page=12`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setItems(data.data)
        if (data?.meta) setLastPage(data.meta.last_page || 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setZoom(1)
    setAutoPlay(true)
    setViewerOpen(true)
  }
  const closeViewer = () => { setViewerOpen(false); setZoom(1) }

  const nextItem = useCallback(() => {
    setViewerIndex(i => (i + 1) % items.length)
    setZoom(1)
    setAutoPlay(false)
  }, [items.length])

  const prevItem = useCallback(() => {
    setViewerIndex(i => (i - 1 + items.length) % items.length)
    setZoom(1)
    setAutoPlay(false)
  }, [items.length])

  // Auto-slide
  useEffect(() => {
    if (!viewerOpen || !autoPlay) return
    const timer = setInterval(() => {
      setViewerIndex(i => (i + 1) % items.length)
      setZoom(1)
    }, 5000)
    return () => clearInterval(timer)
  }, [viewerOpen, autoPlay, items.length])

  // Keyboard
  useEffect(() => {
    if (!viewerOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer()
      if (e.key === 'ArrowRight') nextItem()
      if (e.key === 'ArrowLeft') prevItem()
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3))
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5))
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [viewerOpen, nextItem, prevItem])

  const latest = items[0]
  const archive = items.slice(1)
  const currentItem = items[viewerIndex]

  // Group archive by date
  const grouped = archive.reduce<Record<string, EkoranItem[]>>((acc, item) => {
    const dateKey = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(item)
    return acc
  }, {})

  return (
    <>
      <Breadcrumb items={[{ name: 'e-Koran' }]} />

      <section className="container-main pb-12">
        {/* Hero Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-[url('/images/fallback-thumb.svg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative px-6 py-10 text-center text-white sm:py-14">
            <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-sm">📰</span>
              <span className="text-xs font-medium uppercase tracking-wider">E-Koran Digital</span>
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">E-KORAN</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-300">
              E-Koran pertama di Indonesia berbasis media sosial. Terbit setiap hari dan disebarkan melalui media sosial secara langsung.
            </p>
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">Total Pelanggan</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold">
                <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                68,371
              </p>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-green-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-600"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Berlangganan GRATIS WhatsApp
            </a>
          </div>
        </div>

        {/* Galeri Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl">📰</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Galeri E-Koran</h2>
            <p className="text-sm text-gray-500">Koleksi lengkap koran digital harian</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />)}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <p className="text-sm text-gray-500">Belum ada edisi e-Koran</p>
          </div>
        ) : (
          <>
            {/* Edisi Terbaru */}
            {latest && (
              <div className="mb-8">
                <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">Edisi Terbaru</h2>
                <div className="flex gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => openViewer(0)}
                    className="relative h-44 w-32 shrink-0 overflow-hidden rounded-lg shadow-lg sm:h-52 sm:w-36"
                  >
                    <Image
                      src={getImageUrl(latest.cover_url)}
                      alt={`Cover: ${latest.title}`}
                      fill
                      className="object-cover"
                      sizes="144px"
                      loading="lazy"
                      {...getBlurProps()}
                      unoptimized
                    />
                  </button>
                  <div className="flex flex-col justify-center">
                    <span className="mb-2 inline-block w-fit rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white">Terbaru</span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{latest.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatRelative(latest.date)}
                    </p>
                    <button
                      type="button"
                      onClick={() => openViewer(0)}
                      className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Baca Online
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Arsip E-Koran */}
            {Object.keys(grouped).length > 0 && (
              <div>
                <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Arsip E-Koran</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(grouped).map(([dateKey, dateItems]) => (
                    <div key={dateKey}>
                      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {dateKey}
                      </h3>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {dateItems.map((item) => {
                          const globalIdx = items.findIndex(i => i.id === item.id)
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => openViewer(globalIdx)}
                              className="group shrink-0"
                              aria-label={`Baca ${item.title}`}
                            >
                              <div className="relative h-48 w-32 overflow-hidden rounded-lg shadow-md transition-transform group-hover:scale-[1.02] sm:h-56 sm:w-36">
                                <Image
                                  src={getImageUrl(item.cover_url)}
                                  alt={`Cover: ${item.title}`}
                                  fill
                                  className="object-cover"
                                  sizes="144px"
                                  loading="lazy"
                                  {...getBlurProps()}
                                  unoptimized
                                />
                                {item.views && item.views > 0 && (
                                  <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {item.views > 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 line-clamp-2 w-32 text-left text-[11px] font-medium text-gray-700 group-hover:text-primary dark:text-gray-300 sm:w-36">{item.title}</p>
                              <p className="mt-0.5 text-left text-[10px] text-gray-400">{formatRelative(item.date)}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600">Sebelumnya</button>
                <span className="flex items-center rounded bg-primary px-4 py-2 text-sm text-white">{page} / {lastPage}</span>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600">Selanjutnya</button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Fullscreen Viewer */}
      {viewerOpen && currentItem && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black">
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{currentItem.title}</p>
              <p className="text-xs text-gray-400">{new Date(currentItem.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button onClick={closeViewer} aria-label="Tutup" className="ml-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <button onClick={prevItem} aria-label="Sebelumnya" className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
              <Image src={getImageUrl(currentItem.cover_url)} alt={currentItem.title} width={600} height={800} className="max-h-[80vh] w-auto object-contain" priority unoptimized />
            </div>

            <button onClick={nextItem} aria-label="Berikutnya" className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} aria-label="Perbesar" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              </button>
              <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} aria-label="Perkecil" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
              </button>
            </div>
          </div>

          <div className="shrink-0 py-3 text-center">
            <p className="text-xs text-gray-400">{viewerIndex + 1} dari {items.length}</p>
            <div className="mt-2 flex justify-center gap-1">
              {items.map((_, i) => (
                <button key={i} onClick={() => { setViewerIndex(i); setZoom(1); setAutoPlay(false) }} aria-label={`Edisi ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === viewerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))
  if (diff < 1) return 'Baru saja'
  if (diff < 24) return `${diff} jam yang lalu`
  const days = Math.floor(diff / 24)
  if (days < 7) return `${days} hari yang lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
