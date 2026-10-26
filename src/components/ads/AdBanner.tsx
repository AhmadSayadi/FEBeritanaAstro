'use client'

import { useState, useEffect, useRef } from 'react'

interface AdData {
  id: number
  posisi: string
  tipe: 'gambar' | 'html_embed' | 'artikel_sponsor'
  image_url?: string
  click_url?: string
  alt_text?: string
  sponsor?: string
  html?: string
  size?: string
}

interface AdBannerProps {
  posisi: string
  category?: string
  className?: string
  /**
   * Keep the reserved height even when no ad resolves. Use for above-the-fold
   * slots (e.g. header_atas sits right above <main>): collapsing an empty slot
   * from its reserved height to 0 shifts the whole page down and spikes CLS.
   * A stable, always-present banner slot is standard and avoids that shift.
   */
  persistHeight?: boolean
}

// Reserved height per ad position so the slot doesn't collapse-then-pop when the
// async ad resolves (prevents layout shift / CLS). Tuned to common banner sizes.
const RESERVED_MIN_HEIGHT: Record<string, number> = {
  header_atas: 90,
  atas_footer: 90,
  mobile_bawah: 50,
  artikel_tengah: 250,
  artikel_bawah: 250,
  artikel_sidebar: 250,
  sidebar_tetap: 250,
  kategori_atas: 90,
}

export function AdBanner({ posisi, category, className = '', persistHeight = false }: AdBannerProps) {
  const [ad, setAd] = useState<AdData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [tracked, setTracked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check global ads_enabled from settings (cached in sessionStorage)
    const cached = sessionStorage.getItem('ads_enabled')
    if (cached === 'false') { setLoaded(true); return }

    // If not cached yet, fetch settings to check
    if (!cached) {
      fetch('/api/navigation')
        .then(res => res.json())
        .then(data => {
          const enabled = data?.ads_enabled !== false
          sessionStorage.setItem('ads_enabled', String(enabled))
          if (!enabled) { setLoaded(true); return }
          fetchAd()
        })
        .catch(() => fetchAd())
      return
    }

    fetchAd()

    function fetchAd() {
      const params = new URLSearchParams({ posisi })
      if (category) params.set('category', category)

      fetch(`/api/ads/banner?${params}`)
        .then(res => res.json())
        .then(data => {
          if (data?.data) setAd(data.data)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }
  }, [posisi, category])

  // Track view with IntersectionObserver
  useEffect(() => {
    if (!ad || tracked) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackAd(ad.id, 'view')
          setTracked(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ad, tracked])

  // Before the async ad resolves, hold a reserved-height placeholder so content
  // below doesn't jump when the ad appears (CLS). Once loaded with no ad, render
  // nothing (no permanent empty gap) — UNLESS persistHeight keeps the slot for
  // above-the-fold positions, where collapsing would shift <main> and spike CLS.
  if (!ad) {
    const minHeight = RESERVED_MIN_HEIGHT[posisi] ?? 0
    if (loaded && !persistHeight) return null
    if (!minHeight) return null
    return <div className={className} style={{ minHeight }} aria-hidden="true" />
  }

  const handleClick = () => {
    trackAd(ad.id, 'click')
  }

  if (ad.tipe === 'html_embed' && ad.html) {
    return (
      <div
        ref={ref}
        className={`ad-container relative ${className}`}
        data-ad-id={ad.id}
      >
        <span className="absolute right-1 top-1 rounded bg-gray-200 px-1 py-0.5 text-[9px] text-gray-500">Iklan</span>
        <div dangerouslySetInnerHTML={{ __html: ad.html }} />
      </div>
    )
  }

  if (ad.tipe === 'artikel_sponsor') {
    return (
      <div ref={ref} className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`} data-ad-id={ad.id}>
        <span className="absolute left-2 top-2 z-10 rounded bg-gray-800/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Sponsored</span>
        <a
          href={ad.click_url}
          target="_blank"
          rel="noopener sponsored"
          onClick={handleClick}
          className="block"
        >
          {ad.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.image_url} alt={ad.alt_text || ''} className="w-full object-cover" />
          )}
          {ad.sponsor && (
            <div className="p-3">
              <p className="text-xs text-gray-500">oleh <span className="font-medium">{ad.sponsor}</span></p>
            </div>
          )}
        </a>
      </div>
    )
  }

  // Default: tipe === 'gambar'
  return (
    <div ref={ref} className={`relative text-center ${className}`} data-ad-id={ad.id}>
      <span className="absolute right-1 top-1 rounded bg-white/80 px-1 py-0.5 text-[9px] text-gray-400 dark:bg-gray-800/80">Iklan</span>
      <a
        href={ad.click_url}
        target="_blank"
        rel="noopener sponsored"
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image_url}
          alt={ad.alt_text || 'Iklan'}
          className="mx-auto max-w-full rounded"
          loading="lazy"
        />
      </a>
    </div>
  )
}

function trackAd(adId: number, action: 'view' | 'click') {
  fetch(`/api/ads/${adId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      page_url: typeof window !== 'undefined' ? window.location.pathname : '',
    }),
  }).catch(() => {})
}
