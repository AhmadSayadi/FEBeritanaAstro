'use client'

import { useEffect, useState } from 'react'
import { usePathname } from '@/compat/navigation'
import { BreakingNews } from './BreakingNews'
import { getNavigation } from '@/lib/navigation-cache'

interface BreakingItem {
  title: string
  slug: string
  category_slug?: string
}

interface CategoryColor {
  slug: string
  color: string
}

export function BreakingNewsBanner({ initialItems = [] }: { initialItems?: BreakingItem[] }) {
  const [items, setItems] = useState<BreakingItem[]>(initialItems)
  const [speed, setSpeed] = useState(30)
  const [categoryColors, setCategoryColors] = useState<CategoryColor[]>([])
  const pathname = usePathname()

  // Category colors from the shared navigation cache (no extra network call —
  // reuses the payload Header already fetched).
  useEffect(() => {
    let active = true
    getNavigation().then(data => {
      if (!active || !data) return
      const cats = (data.header_categories || data.categories || []) as { slug: string; color?: string }[]
      setCategoryColors(cats.map((c) => ({ slug: c.slug, color: c.color || '' })))
    })
    return () => { active = false }
  }, [])

  // Detect category from URL
  const segments = pathname.split('/').filter(Boolean)
  let categorySlug = ''
  if (pathname.startsWith('/kategori/')) {
    categorySlug = segments[1] || ''
  } else if (segments.length === 1) {
    // Single segment: /{category} — category listing page
    const firstSeg = segments[0]
    if (categoryColors.some(c => c.slug === firstSeg)) {
      categorySlug = firstSeg
    }
  } else if (segments.length === 2) {
    // Two segments: /{category}/{slug} — article detail
    const firstSeg = segments[0]
    if (categoryColors.some(c => c.slug === firstSeg)) {
      categorySlug = firstSeg
    }
  }

  // Don't use category color in dark mode
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const catColor = categoryColors.find(c => c.slug === categorySlug)?.color || null
  const color = isDark ? null : catColor

  // Whether the banner was already present at first paint (server decided this
  // via Layout.astro's fetchBreakingNews(), cached ~LISTING_TTL=30s). This is
  // the ONLY thing that controls whether the bar occupies layout space, so it
  // never changes after mount — eliminating the CLS where a bar used to pop in
  // above the hero after the client fetch resolved.
  const serverHadBanner = initialItems.length > 0
  const [enabled] = useState(serverHadBanner)

  useEffect(() => {
    // Only refresh the CONTENT of an already-rendered bar (keeps breaking items
    // fresh between the ~30s CDN cache windows). We deliberately do NOT flip a
    // hidden banner to visible here: introducing a new full-width row above the
    // hero after paint is exactly what caused the large mobile layout shift
    // (CLS ~0.24). When the server says "no breaking", the next cached HTML
    // (≤30s later) will include it — no post-paint jump needed.
    if (!serverHadBanner) return
    fetch('/api/breaking')
      .then(res => res.json())
      .then(data => {
        // If breaking news disabled from backend, leave the current bar as-is
        // (it will disappear on the next server render). No layout change here.
        if (data?.enabled === false) {
          return
        }

        const items = data?.data || data?.items || []
        if (items.length) {
          setItems(items.map((item: { title: string; slug: string; category?: { slug: string } }) => ({
            title: item.title,
            slug: item.slug,
            category_slug: item.category?.slug || 'nasional',
          })))
        }
        // Speed from API (in seconds)
        if (data?.speed) setSpeed(Number(data.speed))
      })
      .catch(() => {})
  }, [serverHadBanner])

  // Don't render anything if not enabled or no items
  if (!enabled || !items.length) {
    return null
  }

  return <BreakingNews items={items} color={color} speed={speed} />
}
