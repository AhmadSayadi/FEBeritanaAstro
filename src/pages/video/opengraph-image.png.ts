import type { APIRoute } from 'astro'
import { brandOgImage } from '@/lib/og'

export const prerender = false

export const GET: APIRoute = () => brandOgImage({ label: 'Video', title: 'Video Story' })
