# Tasks: Editorial Metadata & Byline

## Status

Sebagian task sudah dikerjakan di sesi sebelumnya tapi belum di-build/commit secara bersih.
Daftar ini mencerminkan kondisi nyata workspace sekarang.

---

## Implementation Plan

- [ ] 1. Tipe data — tambah field editorial & SEO ke Article interface
  - Edit `src/lib/types.ts`: tambah `content_type`, `source_name`, `source_url`, `modified_at`, `fact_checked_by`, `fact_checked_at`, `ai_assisted`, `seo_title`, `meta_description`, `og_image_path`, `noindex`
  - Semua field optional agar artikel lama tetap valid

- [ ] 2. Shared helper content_type
  - Buat `src/lib/contentType.ts` dengan map label+warna per content_type
  - Export `getContentTypeMeta(type)` → `{ label, className } | null`

- [ ] 3. SEO mapping — gunakan field dedicated
  - Edit `src/lib/seo.ts` → `buildArticleSeo()`:
    - `seo_title?.slice(0,60)` sebagai title, fallback `article.title`
    - `meta_description || description || excerpt` dipotong 160 char
    - `og_image_path || thumbnail_url` untuk og:image
    - `modified_at || updated_at || published_at` untuk modifiedTime
    - Wire `noindex: article.noindex ?? false`
    - Gunakan `url_canonical` jika ada
  - Ganti konstanta `FALLBACK_OG_IMAGE` dari `thumbnail_home.png` ke `og-default.jpg`
  - Copy `public/images/thumbnail_home.png` → `public/images/og-default.jpg`

- [ ] 4. twitter:site + twitter:image:alt di Seo.astro
  - Edit `src/components/astro/Seo.astro`
  - Tambah `<meta name="twitter:site" content="@beritanacom" />` (selalu)
  - Tambah `<meta name="twitter:image:alt">` conditional ketika imageURL dan image.alt ada

- [ ] 5. Hapus tag non-standar dari BaseHead.astro
  - Edit `src/components/astro/BaseHead.astro`
  - Hapus `<link rel="ard" href="/.well-known/ard.json" />`
  - Hapus `<meta name="telegram:channel" content="@beritanacom" />`

- [ ] 6. JSON-LD NewsArticle — perbaikan & field baru
  - Edit `src/lib/schema.ts` → `buildNewsArticleSchema()`:
    - `dateModified` ← `modified_at || updated_at || published_at`
    - `image.url` ← `og_image_path || thumbnail_url`
    - Tambah `isBasedOn` conditional jika `article.source_url` ada

- [ ] 7. BreadcrumbList 3 item + WebSite schema di halaman artikel
  - Edit `src/pages/[category]/[slug].astro`
  - Import `buildWebsiteSchema`
  - Tambah artikel sebagai item ke-3 di breadcrumb (Beranda → Kategori → Artikel)
  - Build dan emit `websiteSchema` agar `isPartOf: #website` tidak dangling
  - Urutan emit: `[websiteSchema, articleSchema, breadcrumbSchema, faqSchema]`

- [ ] 8. Byline ArticleHeader — tampilkan semua field baru
  - Edit `src/components/article/ArticleHeader.tsx`
  - Pakai `getContentTypeMeta` dari task 2
  - Tanggal diperbarui: tampilkan jika `|modified_at - published_at| > 60s`
  - Badge content_type dengan warna per tipe
  - Atribusi sumber: "Dilansir dari [source_name]" dengan link `rel="noopener noreferrer nofollow"`
  - Panel fakta-cek hijau dengan link ke profil pemeriksa
  - Pastikan artikel lama (tanpa field baru) tampil identik seperti sebelumnya

- [ ] 9. Badge content_type di daftar artikel halaman profil
  - Edit `src/components/pageviews/AuthorProfilePage.tsx` → `PublicArticleList`
  - Tambah `getContentTypeMeta(article.content_type)` badge di bawah judul
  - Ukuran kecil (`text-[10px]`), tidak tampil jika `content_type` tidak ada

- [ ] 10. Build + verifikasi lokal
  - `DEPLOY_TARGET=node npm run build` — pastikan TypeScript tidak ada error
  - Jalankan `node ./dist/server/entry.mjs` dan test:
    - `curl localhost:4321/[kategori]/[slug-artikel]` → cek JSON-LD di HTML
    - `curl localhost:4321/profile/[penulis]` → cek halaman profil normal
    - `curl localhost:4321/.well-known/ard.json` → tetap 200

- [ ] 11. Commit + deploy ke VPS
  - `git add` file yang berubah
  - `git commit -m "feat(editorial): byline content_type, sumber, fakta-cek, JSON-LD + SEO field dedicated"`
  - `git push origin main`
  - Di VPS: `./deploy.sh`
