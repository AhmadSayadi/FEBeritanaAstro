// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import { fileURLToPath } from 'node:url'

/**
 * Beritana — Astro SSR migration from Next.js 15 (App Router).
 *
 * Adapter is chosen at build time via DEPLOY_TARGET:
 *   - "node"       (default) → @astrojs/node standalone. Runs on shared hosting
 *                              / VPS (like the old server.js) AND on Vercel.
 *   - "vercel"     → @astrojs/vercel (Vercel serverless functions).
 *   - "cloudflare" → @astrojs/cloudflare (Workers/Pages).
 *
 * Only the selected adapter package needs to be installed. node is in deps;
 * install @astrojs/vercel or @astrojs/cloudflare only if you target those.
 */
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'node'

async function resolveAdapter() {
  if (DEPLOY_TARGET === 'vercel') {
    const { default: vercel } = await import('@astrojs/vercel')
    return vercel()
  }
  if (DEPLOY_TARGET === 'cloudflare') {
    const { default: cloudflare } = await import('@astrojs/cloudflare')
    return cloudflare()
  }
  const { default: node } = await import('@astrojs/node')
  // Passenger / cPanel shared hosting: middleware mode + custom server.js
  // (Passenger controls the HTTP server, like the old Next.js server.js).
  if (DEPLOY_TARGET === 'passenger') {
    return node({ mode: 'middleware' })
  }
  return node({ mode: 'standalone' })
}

export default defineConfig({
  site: 'https://beritana.com',
  output: 'server',
  // SEO: enforce a single canonical URL shape. "never" means no trailing slash
  // (/world, not /world/) — matches every canonical/sitemap URL we emit and
  // prevents duplicate-URL indexing. `build.format: 'file'` keeps that shape.
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter: await resolveAdapter(),
  // Prefetch link targets so navigation feels instant. `hover` strategy fetches
  // the destination HTML when the user hovers/taps a link (cheap, safe for MPA).
  // Pure MPA — no View Transitions — so every URL stays a full standalone HTML
  // document (best for news crawling, Google News/Discover, and resilience).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // Permanent redirects — mirror Next's next.config.mjs redirects().
  // Status 308 to match Next's `permanent: true` (preserves request method).
  redirects: {
    '/kebijakan-privasi': { status: 308, destination: '/pages/privacy-policy' },
    '/tentang': { status: 308, destination: '/pages/tentang-kami' },
    '/pedoman': { status: 308, destination: '/pages/pedoman-media-siber' },
    '/kontak': { status: 308, destination: '/pages/contact' },
  },
  integrations: [
    react(),
    tailwind({
      // We provide our own global CSS import (src/styles/globals.css),
      // so disable the integration's injected base stylesheet.
      applyBaseStyles: false,
    }),
  ],
  image: {
    // Match Next config: allow any remote host (images come from cdn.beritana.com etc.)
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    define: {
      // Expose NEXT_PUBLIC_* vars to client bundles (Next inlined these at build time).
      // Server code still reads process.env directly via loadEnv below.
      'process.env.NEXT_PUBLIC_SITE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SITE_URL || 'https://beritana.com'),
      'process.env.NEXT_PUBLIC_SITE_NAME': JSON.stringify(process.env.NEXT_PUBLIC_SITE_NAME || 'Beritana'),
      'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cms.beritana.com/api'),
      'process.env.NEXT_PUBLIC_CDN_BASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.beritana.com'),
      'process.env.NEXT_PUBLIC_CDN_RESIZE': JSON.stringify(process.env.NEXT_PUBLIC_CDN_RESIZE || ''),
      'process.env.NEXT_PUBLIC_GA_ID': JSON.stringify(process.env.NEXT_PUBLIC_GA_ID || ''),
      'process.env.NEXT_PUBLIC_ADSENSE_ID': JSON.stringify(process.env.NEXT_PUBLIC_ADSENSE_ID || ''),
      'process.env.NEXT_PUBLIC_GTM_ID': JSON.stringify(process.env.NEXT_PUBLIC_GTM_ID || ''),
      'process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION': JSON.stringify(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || ''),
      'process.env.NEXT_PUBLIC_BING_VERIFICATION': JSON.stringify(process.env.NEXT_PUBLIC_BING_VERIFICATION || ''),
      'process.env.NEXT_PUBLIC_YANDEX_VERIFICATION': JSON.stringify(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || ''),
    },
    resolve: {
      alias: {
        // Cloudflare Workers has no `MessageChannel`, which React 19's default
        // `react-dom/server.browser` build requires — so SSR crashes at worker
        // startup ("MessageChannel is not defined"). The edge build
        // (`react-dom/server.edge`) doesn't need it. Apply this alias ONLY for
        // the Cloudflare target so the Node/Vercel builds keep the normal build.
        ...(DEPLOY_TARGET === 'cloudflare'
          ? { 'react-dom/server': 'react-dom/server.edge' }
          : {}),
        // Path alias — same as Next's "@/*": "./src/*"
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // next/* compatibility shims so React components migrate unchanged
        'next/link': fileURLToPath(new URL('./src/compat/next/link.tsx', import.meta.url)),
        'next/image': fileURLToPath(new URL('./src/compat/next/image.tsx', import.meta.url)),
        'next/navigation': fileURLToPath(new URL('./src/compat/next/navigation.ts', import.meta.url)),
        'next/script': fileURLToPath(new URL('./src/compat/next/script.tsx', import.meta.url)),
        'next/font/google': fileURLToPath(new URL('./src/compat/next/font-google.ts', import.meta.url)),
        'next/og': fileURLToPath(new URL('./src/compat/next/og.ts', import.meta.url)),
        'next/dynamic': fileURLToPath(new URL('./src/compat/next/dynamic.tsx', import.meta.url)),
      },
    },
    ssr: {
      // Bundle (don't externalize) these for SSR so Vite resolves the CJS/ESM
      // interop at build time:
      //  - TipTap / ProseMirror ship ESM that must be bundled.
      //  - sanitize-html is CommonJS but its dep htmlparser2@12 is pure ESM
      //    (sanitize-html 2.18 officially pairs with it). A raw Node require()
      //    of that chain throws ERR_REQUIRE_ESM, so we bundle the whole chain.
      noExternal: [
        '@tiptap/**',
        'prosemirror-*',
        'sanitize-html',
        'htmlparser2',
        'domhandler',
        'domutils',
        'dom-serializer',
        'domelementtype',
        'entities',
        'parse-srcset',
        'is-plain-object',
        'deepmerge',
        'escape-string-regexp',
      ],
      // `astro dev` serves SSR modules as native ESM via Vite's module runner,
      // where sanitize-html's internal CommonJS require() surfaces as
      // "require is not defined". Force-prebundling it (and its ESM dep
      // htmlparser2) into a single ESM chunk makes the dev server match the
      // production bundle. This is the Vite-sanctioned way to handle a
      // problematic CJS dep in SSR dev. No effect on the production build.
      optimizeDeps: {
        include: ['sanitize-html', 'htmlparser2'],
      },
    },
  },
})
