# Beritana — Frontend (Astro)

Portal berita Beritana, dimigrasikan dari **Next.js 15 (App Router)** ke
**Astro 5 (SSR)**. UI, warna, struktur URL, dan seluruh perilaku SEO dijaga
identik; komponen React interaktif dipertahankan apa adanya dan dijalankan
sebagai **Astro islands**.

> Proyek Next.js lama ada di folder `FEOld/` sebagai **referensi read-only** —
> tidak ikut dibangun dan tidak boleh diubah.

---

## Stack

| | |
|---|---|
| Framework | Astro 5 (`output: 'server'` — SSR) |
| UI | React 19 islands + komponen `.astro` |
| Styling | Tailwind CSS 3 (config & warna identik dengan versi lama) |
| Font | Plus Jakarta Sans (via Google Fonts, variabel `--font-inter`) |
| Data | Backend Laravel di `cms.beritana.com/api` (header `X-API-Key`) |
| Gambar | CDN `cdn.beritana.com` (Cloudflare R2) |
| OG image | `@vercel/og` (Satori) — dinamis per halaman |
| Adapter | `@astrojs/node` (default) · `@astrojs/vercel` · `@astrojs/cloudflare` |

Butuh **Node 22.12.0+** (Astro 7). Astro 7 memakai compiler Rust + Vite 8.

---

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi nilainya (lihat tabel env di bawah)
npm run dev                  # http://localhost:4321
```

### Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server (HMR) |
| `npm run build` | Build produksi (adapter node, default) |
| `npm run preview` | Preview hasil build |
| `npm run start:server` | Jalankan server produksi: `node ./dist/server/entry.mjs` |

---

## Environment variables

Nama variabel sengaja dipertahankan sama seperti versi Next.js. `NEXT_PUBLIC_*`
ter-expose ke browser (ID publik saja); sisanya server-only.

| Key | Contoh | Catatan |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://beritana.com` | Domain produksi (tanpa trailing slash) |
| `NEXT_PUBLIC_SITE_NAME` | `Beritana` | Nama brand |
| `API_BASE_URL` | `https://cms.beritana.com/api` | Backend Laravel (server-only) |
| `API_SECRET_KEY` | `brt-sk-…` | **Rahasia** — jangan pakai prefix `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_CDN_BASE_URL` | `https://cdn.beritana.com` | CDN gambar |
| `REVALIDATE_SECRET` | `beritana-revalidate-2026` | Secret webhook revalidate/IndexNow |
| `INDEXNOW_KEY` | `d2f69834…` | File harus ada di `/public/{key}.txt` |
| `NEXT_PUBLIC_GA_ID` | `G-…` | Google Analytics |
| `NEXT_PUBLIC_ADSENSE_ID` | `ca-pub-…` | Google AdSense |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | | Search Console |
| `NEXT_PUBLIC_BING_VERIFICATION` | | Bing Webmaster |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | | Yandex |

> Saat runtime produksi (`node dist/server/entry.mjs`), nilai `.env` **tidak**
> otomatis dimuat — set variabel lewat environment hosting (Vercel/Cloudflare/
> panel VPS). Modul `src/lib/env.ts` membaca `import.meta.env` (build) dan
> `process.env` (runtime) sekaligus, jadi keduanya aman.

---

## Deploy

Adapter dipilih lewat `DEPLOY_TARGET` saat build.

### 1a. VPS / Cloud (Node standalone) — default

```bash
npm run build
# jalankan (mis. via PM2):
HOST=0.0.0.0 PORT=3000 node ./dist/server/entry.mjs
# atau: npm run start:server
```

### 1b. Shared hosting (cPanel "Setup Node.js App" / Phusion Passenger)

> **Syarat:** hosting mendukung Node.js 22+ (menu "Setup Node.js App" di cPanel).
> Shared hosting PHP-only (tanpa Node) **tidak bisa** menjalankan SSR.

Build memakai mode **middleware** + `server.js` sebagai entry (Passenger yang
memegang HTTP server, persis seperti `server.js` di versi Next.js lama).

```bash
npm run build:passenger      # = DEPLOY_TARGET=passenger astro build
```

Lalu upload ke hosting dan set di cPanel → **Setup Node.js App**:

| Field | Value |
|---|---|
| Application root | folder tempat `server.js` berada |
| Application startup file | `server.js` |
| Node.js version | 22.x |
| Application mode | Production |

Yang harus ikut di-upload: `server.js`, `dist/`, `node_modules/` (atau jalankan
"Run NPM Install" dari cPanel), `package.json`. Set Environment Variables di
panel yang sama (lihat tabel env). Lalu **Restart** aplikasi.

`server.js` otomatis menyajikan aset statis dari `dist/client` dan mem-forward
sisanya ke handler SSR Astro.

### 2. Vercel

- Build Command: `npm run build:vercel`
- Install Command: `npm install`
- Framework Preset: **Other**
- Set semua env di Dashboard → Settings → Environment Variables
- `vercel.json` sudah menyertakan cache-control untuk aset & file SEO

### 3. Cloudflare Workers — direkomendasikan untuk hemat biaya

Cloudflare **tidak punya ISR Writes / CPU-hours** yang membuat free tier Vercel
cepat jebol untuk situs berita. Pengganti ISR di sini adalah cache CDN via
header `s-maxage` (dari `middleware.ts`), jadi metrik termahal Vercel tidak ada.

> Sejak `@astrojs/cloudflare` v14 (Astro 7), adapter menargetkan **Cloudflare
> Workers (static assets)**, bukan lagi Pages `_worker.js`. Build menghasilkan
> `dist/client` (aset statis) + `dist/server` (worker + `wrangler.json` yang
> digenerate adapter). Aset statis dilayani langsung tanpa memanggil Worker
> (tidak memakai jatah request) — pola paling hemat untuk free tier.

- Build Command: `npm run build:cloudflare`
- Deploy: `npx wrangler deploy` (dijalankan setelah build; atau lewat Git /
  Workers Builds di dashboard)
- Set semua env (`.env`) di Dashboard → Worker → Settings → Variables
- Adapter `@astrojs/cloudflare` sudah di `optionalDependencies`

**Wajib: `nodejs_compat`.** SSR worker mengimpor `sanitize-html` (membersihkan
HTML penulis di halaman artikel/pages) yang butuh Node API. Tanpa flag ini
halaman artikel error saat runtime walau build sukses. Nilai ini ada di
`wrangler.toml` (dan ikut digenerate ke `dist/server/wrangler.json`):

```toml
compatibility_date  = "2024-11-01"
compatibility_flags = ["nodejs_compat"]
```

**React 19 + Cloudflare.** Build Cloudflare mengalias `react-dom/server` ke
`react-dom/server.edge` (di `astro.config.mjs`, hanya untuk target cloudflare),
karena build `server.browser` default React 19 memakai `MessageChannel` yang
tidak ada di Workers → tanpa alias ini worker gagal start
("MessageChannel is not defined"). Alias ini tidak memengaruhi build Node/Vercel.

Uji runtime Cloudflare secara lokal sebelum deploy:

```bash
npm run build:cloudflare
npx wrangler dev --config dist/server/wrangler.json   # Workers runtime asli
```

> Catatan cache: di Workers, cache in-memory (`ssrCache`) bisa ter-reset antar
> isolate, jadi yang diandalkan adalah cache CDN `s-maxage`. Ini justru lebih
> efektif dan gratis di Cloudflare.

### DNS / arsitektur

```
beritana.com (Cloudflare DNS)
 ├── www / root → Vercel atau VPS (frontend Astro ini)
 └── cms.beritana.com (proxied, WAF) → Laravel + /api/* + MySQL
Gambar → cdn.beritana.com (Cloudflare R2)
```

Redirect `beritana.com` → `www` (jika dipakai) diatur di Cloudflare/host.

---

## Filosofi SEO (cara Astro, bukan meniru Next.js)

Astro unggul untuk SEO karena **cara render-nya**, bukan jenis tag-nya. Prinsip
yang dipegang proyek ini:

- **MPA murni, bukan SPA.** Tidak memakai View Transitions/ClientRouter. Setiap
  URL adalah dokumen HTML lengkap yang di-render server dan berdiri sendiri —
  paling andal untuk crawling, Google News, dan Discover. Tidak bergantung pada
  JS untuk navigasi atau menampilkan konten.
- **Zero-JS untuk konten.** Teks artikel, metadata, dan JSON-LD ada di HTML awal
  (SSR). JavaScript hanya dikirim untuk island yang benar-benar interaktif.
- **Kecepatan lewat prefetch native** (`prefetch` di astro.config, strategi
  `hover`): HTML tujuan diambil saat hover/tap, jadi klik terasa instan — tanpa
  mengorbankan sifat MPA/SEO.
- **URL kanonik tunggal.** `trailingSlash: 'never'` + `build.format: 'file'` →
  `/world` (bukan `/world/`); `/world/` otomatis 301 ke `/world`. Mencegah
  duplikat URL di indeks.
- **Sitemap/News-sitemap/RSS via endpoint Astro** (`src/pages/*.xml.ts`
  mengembalikan `Response`). `@astrojs/sitemap` sengaja TIDAK dipakai karena
  hanya meng-cover halaman statis saat build — tidak bisa mengenumerasi ribuan
  URL artikel dinamis dari API, dan tidak mendukung ekstensi Google News
  (`news:`). Endpoint custom adalah mekanisme native Astro untuk kasus dinamis.

## Arsitektur migrasi (ringkas)

- **Clean URL** ditangani file-based routing Astro, bukan rewrite middleware:
  - `src/pages/[category]/[slug].astro` → artikel (`/{kategori}/{judul}`)
  - `src/pages/[slug].astro` → kategori (`/{kategori}`)
  - Route statis (`/video`, `/tag`, dll) menang otomatis karena prioritas Astro.
  - `/berita/{slug}` & `/kategori/{slug}` lama → **301** ke URL kanonik.
- **Komponen React tidak diubah.** Kompatibilitas lewat shim di `src/compat/next/`:
  `next/link`, `next/image`, `next/navigation`, `next/script`, `next/font/google`,
  `next/dynamic`, `next/og`.
- **SEO** dibangun server-side: `generateMetadata` → `src/lib/render-metadata.ts`
  + `SeoHead.astro`; JSON-LD (NewsArticle, Breadcrumb, CollectionPage, Person,
  WebSite, ItemList, VideoObject, ImageObject, BroadcastEvent, FAQ) di frontmatter.
- **Endpoint SEO**: `robots.txt`, `sitemap.xml`, `sitemap-index.xml`,
  `sitemap-articles/[chunk].xml`, `news-sitemap.xml` (+index, +per-kategori),
  `feed.xml`, `rss/category` (OPML) + per-kategori, `manifest.webmanifest`.
- **API** (`/api/*`): 41 endpoint proxy ke Laravel (helper `src/lib/api-proxy.ts`).
- **OG image** dinamis per halaman di `.../opengraph-image.png`.

Lihat `FEOld/` untuk membandingkan sumber asli bila perlu.

---

## Struktur folder

```
src/
  compat/next/      # shim kompatibilitas next/*
  components/       # komponen React (disalin apa adanya dari FEOld)
    astro/          #   komponen .astro (BaseHead, SeoHead, Footer)
    pageviews/      #   view halaman yang dulu colocated di app/
  layouts/Layout.astro
  lib/              # data, api, seo, schema, env, og, dll
  pages/            # route Astro (halaman, endpoint SEO, /api/*)
  styles/globals.css
public/             # aset statis (gambar, favicon, IndexNow key, dll)
FEOld/              # proyek Next.js lama — REFERENSI, jangan diubah
```
