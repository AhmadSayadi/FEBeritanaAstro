'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BreakingNews } from './BreakingNews'

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

  // Fetch category colors from navigation API
  useEffect(() => {
    fetch('/api/navigation')
      .then(res => res.json())
      .then(data => {
        const cats = data?.header_categories || data?.categories || []
        setCategoryColors(cats.map((c: { slug: string; color: string }) => ({ slug: c.slug, color: c.color })))
      })
      .catch(() => {})
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

  const [enabled, setEnabled] = useState(initialItems.length > 0)

  useEffect(() => {
    fetch('/api/breaking')
      .then(res => res.json())
      .then(data => {
        // If breaking news disabled from backend
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
          setEnabled(true)
        }
        // Speed from API (in seconds)
        if (data?.speed) setSpeed(Number(data.speed))
      })
      .catch(() => {})
  }, [])

  // Don't render anything if not enabled or no items
  if (!enabled || !items.length) {
    return null
  }

  if (!items.length) return null

  return <BreakingNews items={items} color={color} speed={speed} />
}
