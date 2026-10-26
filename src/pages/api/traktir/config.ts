import type { APIRoute } from 'astro'
import { getSiteConfig } from '@/lib/site-config'
import { getImageUrl } from '@/lib/api'
import type { TraktirConfig } from '@/lib/types'
import { jsonResponse } from '@/lib/api-proxy'

export const prerender = false

/**
 * Public proxy for Traktir Kopi config. Client components can't read the
 * server-only API env, so this returns only public fields (no credentials).
 */
export const GET: APIRoute = async () => {
  const config = await getSiteConfig()
  const tk = config.traktir_kopi

  const payload: TraktirConfig = {
    active: !!tk?.active,
    payment_provider: tk?.payment_provider === 'duitku' ? 'duitku' : 'static_qris',
    qris_image_url: tk?.qris_image_url ? getImageUrl(tk.qris_image_url) : null,
    coffee_options: Array.isArray(tk?.coffee_options) ? tk.coffee_options : [],
  }

  return jsonResponse(payload)
}
