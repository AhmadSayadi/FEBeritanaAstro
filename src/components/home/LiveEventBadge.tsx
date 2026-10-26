'use client'

import { useState, useEffect } from 'react'
import Link from '@/compat/Link'

interface LiveEvent {
  id: number
  title: string
  slug: string
  status: string
  viewers?: number
}

export function LiveEventBadge({ initialEvent = null }: { initialEvent?: LiveEvent | null }) {
  const [event, setEvent] = useState<LiveEvent | null>(initialEvent)

  useEffect(() => {
    fetch('/api/live')
      .then(res => res.json())
      .then(data => {
        const events = data?.data || []
        const live = events.find((e: LiveEvent) => e.status === 'live')
        setEvent(live || null)
      })
      .catch(() => {})
  }, [])

  if (!event) return null

  return (
    <div className="bg-red-600 py-1.5">
      <div className="container-main flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="text-xs font-bold uppercase text-white">LIVE</span>
        </span>
        <Link href={`/live/${event.slug}`} className="text-sm font-medium text-white hover:underline">
          {event.title}
        </Link>
        {event.viewers && event.viewers > 0 && (
          <span className="text-xs text-white/70">{event.viewers.toLocaleString()} menonton</span>
        )}
      </div>
    </div>
  )
}
