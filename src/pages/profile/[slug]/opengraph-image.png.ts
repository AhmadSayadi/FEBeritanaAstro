import type { APIRoute } from 'astro'
import { fetchAuthorProfile } from '@/lib/data'
import { getImageUrl } from '@/lib/api'
import { profileOgImage } from '@/lib/og'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!
  let name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  let role = ''
  let avatarUrl = ''

  try {
    const result = await fetchAuthorProfile(slug)
    const a = result?.data
    if (a) {
      name = a.name || name
      role = a.role || ''
      if (a.avatar_url) avatarUrl = getImageUrl(a.avatar_url, { width: 400 })
    }
  } catch {
    // defaults
  }

  return profileOgImage({ name, role, avatarUrl })
}
