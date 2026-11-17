# Design: Editorial Metadata & Byline

## Arsitektur saat ini yang relevan

```
src/
  lib/
    types.ts          ← Article interface (server + client)
    seo.ts            ← buildArticleSeo() → SeoProps
    schema.ts         ← buildNewsArticleSchema(), buildBreadcrumbSchema()
    date.ts           ← formatBylineDateTimeID() (WIB-safe)
    contentType.ts    ← BARU: label/warna per content_type (shared)
  components/
    astro/
      Seo.astro       ← emit semua <meta> per-halaman
      BaseHead.astro  ← tag statis di <head>
    article/
      ArticleHeader.tsx ← byline, hero image
  pages/
    [category]/[slug].astro ← JSON-LD + SSR artikel
    profile/[slug].astro    ← halaman profil penulis (sudah ada)
  pageviews/
    AuthorProfilePage.tsx   ← island profil penulis (sudah ada)
```

---

## Perubahan per file

### `src/lib/types.ts` — Article interface

Tambah field baru (semua optional agar backward-compatible dengan artikel lama):

```ts
// Editorial
content_type?: 'berita' | 'analisis' | 'opini' | 'adaptasi' | 'advertorial' | 'kreatif'
source_name?: string
source_url?: string
modified_at?: string          // ISO 8601 +07:00
fact_checked_by?: { id: number; name: string; slug: string } | null
fact_checked_at?: string | null
ai_assisted?: boolean

// SEO
seo_title?: string            // maks 60 karakter
meta_description?: string     // maks 160 karakter
og_image_path?: string
noindex?: boolean
```

Field `modified_at` duplikat fungsionalnya dengan `updated_at` yang sudah ada.
Prioritas saat render: `modified_at` → `updated_at` → `published_at`.

---

### `src/lib/contentType.ts` — BARU (shared helper)

Supaya label/warna tidak diduplikasi antara `ArticleHeader` dan `AuthorProfilePage`:

```ts
export const CONTENT_TYPE_META: Record<
  NonNullable<Article['content_type']>,
  { label: string; className: string }
> = { ... }

export function getContentTypeMeta(type?: Article['content_type'])
  : { label: string; className: string } | null
```

---

### `src/lib/seo.ts` — buildArticleSeo()

Prioritas baru:
- `title` ← `seo_title?.slice(0,60)` || `article.title`
- `description` ← `meta_description` || `description` || `excerpt` (slice 160)
- `image.url` ← `safeOgImage(og_image_path || thumbnail_url)`
- `article.modifiedTime` ← `modified_at || updated_at || published_at`
- `noindex` ← `article.noindex ?? false`
- `canonical` ← `url_canonical` || `/${categorySlug}/${slug}`

Fallback og:image tetap `/images/og-default.jpg` (bukan `thumbnail_home.png`).
File `public/images/og-default.jpg` di-copy dari `thumbnail_home.png` (sudah ada).

---

### `src/components/astro/Seo.astro` — twitter:site + twitter:image:alt

Tambah dua baris di blok Twitter:
```astro
<meta name="twitter:site" content="@beritanacom" />
{imageURL && image?.alt && <meta name="twitter:image:alt" content={image.alt} />}
```

---

### `src/components/astro/BaseHead.astro` — hapus tag non-standar

Hapus:
- `<link rel="ard" href="/.well-known/ard.json" />` — well-known path sudah cukup
- `<meta name="telegram:channel" content="@beritanacom" />` — tidak ada standar

---

### `src/lib/schema.ts` — buildNewsArticleSchema()

Perubahan:
1. `dateModified` ← `modified_at || updated_at || published_at`
2. `image.url` ← `getImageUrl(og_image_path || thumbnail_url, { width: 1200 })`
3. Tambah `isBasedOn` conditional:
   ```ts
   ...(article.source_url ? {
     isBasedOn: {
       '@type': 'CreativeWork',
       url: article.source_url,
       ...(article.source_name ? { name: article.source_name } : {}),
     }
   } : {})
   ```

Tidak perlu mengubah `author` (sudah Person + url) atau `publisher` (sudah @id reference yang resolve via Layout).

---

### `src/pages/[category]/[slug].astro` — JSON-LD artikel

1. Import `buildWebsiteSchema`
2. Build `websiteSchema` di dalam try/catch
3. Tambah artikel sebagai item ke-3 di breadcrumb:
   ```ts
   buildBreadcrumbSchema([
     { name: 'Beranda', url: siteUrl },
     { name: article.category?.name, url: `${siteUrl}/${categorySlug}` },
     { name: article.title, url: `${siteUrl}/${categorySlug}/${article.slug}` },
   ])
   ```
4. Emit: `<JsonLd schema={[websiteSchema, articleSchema, breadcrumbSchema, faqSchema]} />`

---

### `src/components/article/ArticleHeader.tsx` — byline lengkap

Layout byline baru:

```
[ Avatar ] [ Nama (link profil) · role ]
           [ Terbit DD Mmm YYYY HH:MM WIB ]
           [ ↺ Diperbarui ... ] (conditional)
           [ Badge content_type ] (conditional)

[ ─── Dilansir dari [source_name] ─── ] (conditional: source_url ada)

[ ✓ Telah dicek faktanya oleh [nama] pada ... ] (conditional: fact_checked_by ada)

[ Hero Image ]
```

Semua conditional — artikel lama yang tidak punya field baru tampil persis seperti sebelumnya.

---

### `src/components/pageviews/AuthorProfilePage.tsx` — badge di daftar artikel

Di `PublicArticleList`, tambah `content_type` badge di bawah judul artikel (pakai `getContentTypeMeta` dari `contentType.ts`). Ukuran badge lebih kecil (`text-[10px]`), opsional.

---

## Data flow artikel

```
Backend Laravel → fetchArticleFull(slug)
    ↓
[category]/[slug].astro (SSR)
    ├─ buildArticleSeo(article)       → SeoProps → <Seo> → <meta>
    ├─ buildNewsArticleSchema(article) → JSON-LD NewsArticle
    ├─ buildBreadcrumbSchema([3 item]) → JSON-LD BreadcrumbList
    ├─ buildWebsiteSchema()            → JSON-LD WebSite (#website resolves)
    └─ <ArticleCore article={article} client:visible>
           └─ ArticleHeader.tsx
                  ├─ byline (nama, tanggal, modified, content_type badge)
                  ├─ atribusi sumber  (conditional)
                  └─ fakta cek panel  (conditional)
```

---

## Tidak diubah

- UI/warna/layout selain area byline artikel — `ArticleCore`, sidebar, komentar, dsb.
- Logika routing, middleware, caching — tidak ada perubahan.
- Halaman profil penulis (`AuthorProfilePage.tsx`) — sudah lengkap (cover, avatar, bio, tabs, load-more artikel). Hanya tambah badge `content_type` opsional di daftar artikel.
- Backend API — semua perubahan hanya di sisi frontend yang membaca field baru. Field yang belum dikirim backend cukup `undefined`, conditional rendering menanganinya.

---

## Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Backend lama belum kirim `content_type` → badge tidak muncul | Semua field optional di types.ts; conditional rendering |
| `modified_at` = `updated_at` → "Diperbarui" muncul tapi sama dengan terbit | Guard: tampilkan hanya jika beda > 60 detik |
| `seo_title` > 60 karakter dari backend | `slice(0, 60)` di buildArticleSeo |
| `og-default.jpg` belum 1200×630 | Copy dari `thumbnail_home.png` yang sudah ada |
| Duplikasi WebSite schema (homepage + artikel) | JSON-LD valid dengan @id deduplication, tidak ada error |
