/**
 * next/og compatibility shim.
 *
 * Next's `next/og` re-exports `ImageResponse` from `@vercel/og` (Satori + resvg)
 * to render dynamic Open Graph images. We re-export the same class so the
 * migrated OG generators (src/lib/og.tsx and the opengraph-image endpoints)
 * work unchanged. `@vercel/og` runs on Node and Vercel; on Cloudflare use
 * `workers-og` with the same `ImageResponse` API.
 */
export { ImageResponse } from '@vercel/og'
