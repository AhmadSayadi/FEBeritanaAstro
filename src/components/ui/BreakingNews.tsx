'use client'

import Link from 'next/link'

interface BreakingNewsItem {
  title: string
  slug: string
  category_slug?: string
}

interface BreakingNewsProps {
  items: BreakingNewsItem[]
  color?: string | null
  speed?: number // seconds per loop, default 30
}

export function BreakingNews({ items, color, speed = 30 }: BreakingNewsProps) {
  if (!items.length) return null

  const bgColor = color ? color + 'dd' : undefined

  return (
    <div
      className="relative overflow-hidden shadow-sm"
      style={{ backgroundColor: bgColor || '#991b1b' }}
    >
      <div className="container-main flex items-center gap-3 py-1.5">
        <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-bold uppercase text-primary">
          Breaking
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap" style={{ animationDuration: `${speed}s` }}>
            {items.map((item, i) => (
              <Link
                key={i}
                href={`/${item.category_slug || 'nasional'}/${item.slug}`}
                className="mr-12 inline-block text-sm text-white hover:underline"
              >
                {item.title}
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {items.map((item, i) => (
              <Link
                key={`dup-${i}`}
                href={`/${item.category_slug || 'nasional'}/${item.slug}`}
                className="mr-12 inline-block text-sm text-white hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
