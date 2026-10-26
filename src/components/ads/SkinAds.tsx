'use client'

import { useState, useEffect, useRef } from 'react'

interface SkinAdData {
  id: number
  posisi: string
  tipe: string
  image_url?: string
  click_url?: string
  alt_text?: string
  html?: string
  size?: string
}

export function SkinAds() {
  const [leftAd, setLeftAd] = useState<SkinAdData | null>(null)
  const [rightAd, setRightAd] = useState<SkinAdData | null>(null)
  const [leftTracked, setLeftTracked] = useState(false)
  const [rightTracked, setRightTracked] = useState(false)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1400) return

    fetch('/api/ads/banner?posisi=skin_kiri')
      .then(res => res.json())
      .then(data => { if (data?.data) setLeftAd(data.data) })
      .catch(() => {})

    fetch('/api/ads/banner?posisi=skin_kanan')
      .then(res => res.json())
      .then(data => { if (data?.data) setRightAd(data.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (leftAd && !leftTracked) { trackAd(leftAd.id, 'view'); setLeftTracked(true) }
    if (rightAd && !rightTracked) { trackAd(rightAd.id, 'view'); setRightTracked(true) }
  }, [leftAd, rightAd, leftTracked, rightTracked])

  if (!leftAd && !rightAd) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 z-20 hidden 2xl:block" style={{ top: '140px', bottom: '60px' }} aria-hidden="true">
      <div className="relative mx-auto h-full overflow-hidden" style={{ maxWidth: 'calc(100% - 40px)' }}>
        {/* Left — offset from edge */}
        {leftAd && (
          <div
            ref={leftRef}
            className="pointer-events-auto absolute top-0"
            style={{ width: '120px', left: '10px' }}
          >
            {renderAd(leftAd)}
          </div>
        )}

        {/* Right — offset from edge */}
        {rightAd && (
          <div
            ref={rightRef}
            className="pointer-events-auto absolute top-0"
            style={{ width: '120px', right: '10px' }}
          >
            {renderAd(rightAd)}
          </div>
        )}
      </div>
    </div>
  )
}

function renderAd(ad: SkinAdData) {
  if (ad.tipe === 'html_embed' && ad.html) {
    return <div dangerouslySetInnerHTML={{ __html: ad.html }} />
  }

  return (
    <a
      href={ad.click_url || '#'}
      target="_blank"
      rel="noopener sponsored"
      onClick={() => trackAd(ad.id, 'click')}
      className="block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image_url}
        alt={ad.alt_text || 'Iklan'}
        className="w-full"
        loading="lazy"
      />
    </a>
  )
}

function trackAd(adId: number, action: 'view' | 'click') {
  fetch(`/api/ads/${adId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, page_url: typeof window !== 'undefined' ? window.location.pathname : '' }),
  }).catch(() => {})
}
