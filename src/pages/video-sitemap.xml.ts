/**
 * Google Video sitemap — lists video pages with the `video:video` extension so
 * Google can index them in Video search. Mirrors the news/image sitemap style.
 *
 * Each entry points at the public watch page (/video/{slug}) and declares the
 * thumbnail, title, description, and (when parseable) duration + publication
 * date. Only videos with a usable thumbnail are emitted (video:thumbnail_loc
 * and video:title are required by the spec).
 */
import type { APIRoute } from 'astro'
import { apiFetchCached, getImageUrl } from '@/lib/api'
import { SITE_URL_RAW } from '@/lib/env'

export const prerender = false

interface Video {
  slug: string
  title: string
  thumbnail_url?: string
  thumbnail_alt?: string
  video_url?: string
  duration?: string
  published_at?: string
  source?: string
}

/** "HH:MM:SS" | "MM:SS" | plain seconds → total seconds (video:duration wants seconds). */
function durationSeconds(raw: string | undefined | null): number | undefined {
  if (!raw) return undefined
  const s = String(raw).trim()
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  const parts = s.split(':').map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return undefined
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return undefined
}

function youTubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function youTubePlayerUrl(url: string | undefined): string | null {
  const id = youTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

/**
 * Thumbnail for the sitemap: use the video's own thumbnail if the backend
 * provides one, otherwise derive the YouTube poster (hqdefault). A thumbnail is
 * REQUIRED by the video sitemap spec, so entries without any are skipped.
 */
function videoThumb(v: Video): string | null {
  if (v.thumbnail_url) return getImageUrl(v.thumbnail_url, { width: 1200 })
  const id = youTubeId(v.video_url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

export const GET: APIRoute = async () => {
  const siteUrl = (SITE_URL_RAW || 'https://beritana.com').replace(/\/$/, '')

  let videos: Video[] = []
  try {
    const res = await apiFetchCached<{ data: Video[] }>('/videos?limit=500', 300)
    videos = res.data || []
  } catch {
    // empty sitemap on failure
  }

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

  const urls = videos
    .map((v) => ({ v, thumb: videoThumb(v) }))
    .filter(({ v, thumb }) => thumb && v.title)
    .map(({ v, thumb }) => {
      const page = `${siteUrl}/video/${v.slug}`
      const dur = durationSeconds(v.duration)
      const player = youTubePlayerUrl(v.video_url)
      const desc = `Tonton video: ${v.title}${v.source ? `. Sumber: ${v.source}` : ''}`

      return `  <url>
    <loc>${escapeXml(page)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumb as string)}</video:thumbnail_loc>
      <video:title>${escapeXml(v.title)}</video:title>
      <video:description>${escapeXml(desc)}</video:description>${player ? `
      <video:player_loc>${escapeXml(player)}</video:player_loc>` : ''}${dur ? `
      <video:duration>${dur}</video:duration>` : ''}${v.published_at ? `
      <video:publication_date>${new Date(v.published_at).toISOString()}</video:publication_date>` : ''}
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
