import type { APIRoute } from 'astro'
import { apiFetchCached } from '@/lib/api'
import { brandOgImage } from '@/lib/og'

export const prerender = false

interface LiveEvent {
  title: string
  status: string
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!
  let title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  let isLive = false
  try {
    const res = await apiFetchCached<{ data: LiveEvent }>(`/live/${slug}`, 30)
    if (res?.data?.title) {
      title = res.data.title
      isLive = res.data.status === 'live'
    }
  } catch {
    // default
  }
  return brandOgImage({ label: isLive ? '🔴 LIVE' : 'Live Event', title })
}
