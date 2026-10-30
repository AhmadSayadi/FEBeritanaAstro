// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import node from '@astrojs/node'
import cloudflare from '@astrojs/cloudflare'
import vercel from '@astrojs/vercel'
import { fileURLToPath } from 'node:url'

/**
 * Beritana — Astro 7 SSR. The deploy target is SELECTABLE via the
 * DEPLOY_TARGET env var, so the same codebase deploys to all three without
 * code edits:
 *
 *   DEPLOY_TARGET=node        → @astrojs/node (standalone)  [DEFAULT]
 *       VPS / self-hosted. `node ./dist/server/entry.mjs` (via PM2). No
 *       per-request CPU cap — the reason we run production here: Cloudflare
 *       Workers' free 10ms CPU/request limit can't SSR this app (sanitize-html
 *       + React island render exceeds it → Error 1102 / 503).
 *   DEPLOY_TARGET=cloudflare  → @astrojs/cloudflare (Workers)
 *       Kept working for edge/CDN deploys. Needs wrangler + nodejs_compat.
 *   DEPLOY_TARGET=vercel      → @astrojs/vercel (serverless)
 *       Kept as a managed-serverless fallback.
 *
 * Build: set the env then `astro build`, e.g.
 *   DEPLOY_TARGET=node astro build        (Linux/VPS)
 *   $env:DEPLOY_TARGET='cloudflare'; astro build   (PowerShell)
 */
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'node'

const adapter =
  DEPLOY_TARGET === 'cloudflare'
    ? cloudflare()
    : DEPLOY_TARGET === 'vercel'
      ? vercel()
      : node({ mode: 'standalone' })

// Cloudflare Workers has no `MessageChannel` (needed by React 19's default
// server build), so it must use react-dom/server.edge. Node and Vercel use the
// standard build. Apply the alias ONLY for the cloudflare target.
const reactDomAlias =
  DEPLOY_TARGET === 'cloudflare' ? { 'react-dom/server': 'react-dom/server.edge' } : {}

export default defineConfig({
  site: 'https://beritana.com',
  output: 'server',
  // Astro 7 changed the compressHTML default to 'jsx' (strips whitespace
  // between inline elements, like React — e.g. <span>a</span><em>b</em> → "ab").
  // Keep the v6 HTML-aware behavior to avoid any visual spacing regression.
  compressHTML: true,
  // SEO: enforce a single canonical URL shape. "never" means no trailing slash
  // (/world, not /world/) — matches every canonical/sitemap URL we emit and
  // prevents duplicate-URL indexing. `build.format: 'file'` keeps that shape.
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter,
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
    // Tailwind 3 runs through PostCSS directly (postcss.config.mjs +
    // the @tailwind directives in src/styles/globals.css). The old
    // @astrojs/tailwind integration only wired that up for us and doesn't
    // support Astro 7, so it's removed — styling is unchanged.
  ],
  image: {
    // Match Next config: allow any remote host (images come from cdn.beritana.com etc.)
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    define: {
      // Expose PUBLIC_* vars to client bundles (Next inlined these at build time).
      // Server code still reads process.env directly via loadEnv below.
      'process.env.PUBLIC_SITE_URL': JSON.stringify(process.env.PUBLIC_SITE_URL || 'https://beritana.com'),
      'process.env.PUBLIC_SITE_NAME': JSON.stringify(process.env.PUBLIC_SITE_NAME || 'Beritana'),
      'process.env.PUBLIC_API_BASE_URL': JSON.stringify(process.env.PUBLIC_API_BASE_URL || 'https://cms.beritana.com/api'),
      'process.env.PUBLIC_CDN_BASE_URL': JSON.stringify(process.env.PUBLIC_CDN_BASE_URL || 'https://cdn.beritana.com'),
      'process.env.PUBLIC_CDN_RESIZE': JSON.stringify(process.env.PUBLIC_CDN_RESIZE || ''),
      'process.env.PUBLIC_IMG_RESIZE_PROVIDER': JSON.stringify(process.env.PUBLIC_IMG_RESIZE_PROVIDER || ''),
      'process.env.PUBLIC_ENABLE_ADS': JSON.stringify(process.env.PUBLIC_ENABLE_ADS || ''),
      'process.env.PUBLIC_ENABLE_LIVE_EVENT': JSON.stringify(process.env.PUBLIC_ENABLE_LIVE_EVENT || ''),
      'process.env.PUBLIC_GA_ID': JSON.stringify(process.env.PUBLIC_GA_ID || ''),
      'process.env.PUBLIC_ADSENSE_ID': JSON.stringify(process.env.PUBLIC_ADSENSE_ID || ''),
      'process.env.PUBLIC_GTM_ID': JSON.stringify(process.env.PUBLIC_GTM_ID || ''),
      'process.env.PUBLIC_GOOGLE_VERIFICATION': JSON.stringify(process.env.PUBLIC_GOOGLE_VERIFICATION || ''),
      'process.env.PUBLIC_BING_VERIFICATION': JSON.stringify(process.env.PUBLIC_BING_VERIFICATION || ''),
      'process.env.PUBLIC_YANDEX_VERIFICATION': JSON.stringify(process.env.PUBLIC_YANDEX_VERIFICATION || ''),
    },
    resolve: {
      alias: {
        // react-dom/server.edge ONLY when building for Cloudflare (see above).
        ...reactDomAlias,
        // Project path alias "@/*" -> "./src/*". The former next/* compat
        // aliases are gone: components now import the local compat shims
        // directly from '@/compat/*', so there is no 'next/*' reference left.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
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
