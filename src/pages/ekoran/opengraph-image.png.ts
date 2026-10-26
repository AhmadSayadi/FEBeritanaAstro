import type { APIRoute } from 'astro'
import { brandOgImage } from '@/lib/og'

export const prerender = false

export const GET: APIRoute = () => brandOgImage({ label: 'Digital', title: 'e-Koran' })
