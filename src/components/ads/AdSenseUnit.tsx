'use client'

import { useEffect, useRef, useState } from 'react'

interface AdSenseUnitProps {
  /** data-ad-slot dari dashboard AdSense */
  slot: string
  /** data-ad-format (default: 'auto'). Gunakan 'fluid' untuk in-article/in-feed */
  format?: string
  /** data-ad-layout-key — wajib untuk format 'fluid' in-feed */
  layoutKey?: string
  /** responsive full-width (default true) */
  responsive?: boolean
  /** gaya tambahan untuk <ins> */
  style?: React.CSSProperties
  className?: string
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-2946511422357425'

/**
 * Google AdSense ad unit untuk Next.js App Router.
 *
 * Loader script (adsbygoogle.js) sudah dimuat global di layout.tsx.
 *
 * PENTING — client-only rendering:
 * <ins class="adsbygoogle"> TIDAK dirender di server. Script AdSense menyuntik
 * atribut & iframe ke dalam <ins> saat/ sebelum hydration, yang membuat HTML
 * server ≠ client → hydration mismatch (React #418, args=HTML). Dengan menunda
 * render <ins> sampai setelah mount (client-only), server tidak punya <ins>
 * untuk di-hydrate, sehingga mismatch tidak terjadi.
 */
export function AdSenseUnit({
  slot,
  format = 'auto',
  layoutKey,
  responsive = true,
  style,
  className = '',
}: AdSenseUnitProps) {
  const [mounted, setMounted] = useState(false)
  const pushed = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense belum siap / diblokir — abaikan
    }
  }, [mounted])

  // Sebelum mount: placeholder kosong (jaga ruang, hindari CLS), tanpa <ins>.
  if (!mounted) {
    return <div className={className} style={{ minHeight: 90, ...style }} aria-hidden="true" />
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
    />
  )
}
