/**
 * Entry point for Phusion Passenger / cPanel "Setup Node.js App" (shared hosting).
 *
 * Build for this target with:
 *   npm run build:passenger      (= DEPLOY_TARGET=passenger astro build)
 *
 * That produces an Astro Node adapter in **middleware** mode, which exports a
 * request `handler(req, res, next)`. Passenger owns the HTTP server, so this
 * file just:
 *   1. serves static client assets from dist/client (CSS, JS, images, etc.)
 *   2. delegates everything else to the Astro SSR handler.
 *
 * This mirrors the role of the old Next.js server.js. Written as ESM because
 * package.json has "type": "module".
 */
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'

const CLIENT_DIR = path.join(__dirname, 'dist', 'client')
const SSR_ENTRY = pathToFileURL(path.join(__dirname, 'dist', 'server', 'entry.mjs')).href

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
}

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target))
  // Prevent path traversal outside the client dir.
  if (!p.startsWith(base)) return null
  return p
}

function tryServeStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  if (urlPath === '/' || urlPath.endsWith('/')) return false

  const filePath = safeJoin(CLIENT_DIR, urlPath)
  if (!filePath) return false
  let stat
  try {
    stat = fs.statSync(filePath)
  } catch {
    return false
  }
  if (!stat.isFile()) return false

  const ext = path.extname(filePath).toLowerCase()
  const isHashed = /\/_astro\//.test(urlPath)
  // AI content-declaration files had an explicit 24h TTL in next.config.mjs.
  const isAiDeclaration = urlPath === '/llms.txt' || urlPath === '/llms-full.txt'
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  res.setHeader(
    'Cache-Control',
    isHashed
      ? 'public, max-age=31536000, immutable'
      : isAiDeclaration
        ? 'public, max-age=86400, s-maxage=86400'
        : 'public, max-age=3600'
  )
  res.setHeader('Content-Length', stat.size)
  if (req.method === 'HEAD') {
    res.statusCode = 200
    res.end()
    return true
  }
  fs.createReadStream(filePath).pipe(res)
  return true
}

const { handler } = await import(SSR_ENTRY)

const server = http.createServer((req, res) => {
  try {
    if (tryServeStatic(req, res)) return
    // Astro middleware handler: (req, res, next). next() → 404 fallback.
    handler(req, res, () => {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not Found')
    })
  } catch (err) {
    console.error('Request error:', req.url, err)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`> Beritana (Astro SSR) ready on http://${HOST}:${PORT}`)
})
