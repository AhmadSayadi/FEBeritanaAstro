# Requirements: Editorial Metadata & Byline

## Konteks

Beritana adalah situs berita SSR (Astro 7 + Node VPS). Backend Laravel sudah mulai mengirim
field editorial baru (`content_type`, `source_url`, `source_name`, `fact_checked_by`,
`fact_checked_at`, `modified_at`, `seo_title`, `meta_description`, `og_image_path`, `noindex`).
Frontend belum menampilkan atau memanfaatkan field-field ini.

---

## User Stories

### 1. Pembaca melihat byline lengkap di halaman artikel

**As a** pembaca,
**I want to** melihat siapa yang menulis, kapan terbit, kapan diperbarui, jenis konten, dan sumber artikel,
**So that** saya bisa menilai kredibilitas dan kebaruan informasi.

#### Acceptance Criteria

WHEN artikel ditampilkan
THE SYSTEM SHALL menampilkan nama penulis sebagai link ke halaman profil `/profile/{slug}`

WHEN artikel ditampilkan
THE SYSTEM SHALL menampilkan tanggal terbit dalam format "Terbit DD Mmm YYYY HH:MM WIB"

WHEN `modified_at` atau `updated_at` berbeda lebih dari 1 menit dari `published_at`
THE SYSTEM SHALL menampilkan tanggal diperbarui dalam format "Diperbarui DD Mmm YYYY HH:MM WIB"

WHEN artikel memiliki `content_type`
THE SYSTEM SHALL menampilkan badge label (Berita / Analisis / Opini / Adaptasi / Advertorial / Kreatif) dengan warna berbeda per tipe

WHEN `content_type` adalah "adaptasi" atau artikel memiliki `source_url`
THE SYSTEM SHALL menampilkan kalimat "Dilansir dari [source_name]" dengan hyperlink ke `source_url`, `rel="noopener noreferrer nofollow"`

WHEN artikel memiliki `fact_checked_by`
THE SYSTEM SHALL menampilkan panel hijau "Telah dicek faktanya oleh [nama]" dengan link ke profil pemeriksa dan waktu pengecekan

---

### 2. SEO artikel menggunakan field dedicated bukan fallback generik

**As a** editor yang sudah mengisi `seo_title` dan `meta_description` di CMS,
**I want to** field tersebut benar-benar dipakai di `<title>` dan `<meta name="description">`,
**So that** halaman artikel tampil optimal di SERP.

#### Acceptance Criteria

WHEN artikel memiliki `seo_title` (maks 60 karakter)
THE SYSTEM SHALL menggunakan `seo_title` sebagai `<title>` dan `og:title`

WHEN artikel tidak memiliki `seo_title`
THE SYSTEM SHALL fallback ke `article.title`

WHEN artikel memiliki `meta_description` (maks 160 karakter)
THE SYSTEM SHALL menggunakan `meta_description` sebagai `<meta name="description">`

WHEN artikel tidak memiliki `meta_description`
THE SYSTEM SHALL fallback ke `article.description` lalu `article.excerpt` (dipotong 160 karakter)

WHEN artikel memiliki `og_image_path`
THE SYSTEM SHALL menggunakan `og_image_path` sebagai `og:image` dan `twitter:image`

WHEN tidak ada `og_image_path` maupun `thumbnail_url`
THE SYSTEM SHALL menggunakan `/images/og-default.jpg` (1200×630) sebagai fallback

WHEN artikel memiliki `noindex: true`
THE SYSTEM SHALL mengemit `<meta name="robots" content="noindex, nofollow">`

---

### 3. Twitter Card lengkap di semua halaman

**As a** editor yang men-share artikel di Twitter/X,
**I want to** Twitter Card muncul dengan gambar, judul, deskripsi, dan handle akun,
**So that** engagement di Twitter optimal.

#### Acceptance Criteria

WHEN halaman mana pun di-scrape Twitter/X
THE SYSTEM SHALL menyertakan `<meta name="twitter:site" content="@beritanacom">`

WHEN halaman memiliki `og:image`
THE SYSTEM SHALL menyertakan `<meta name="twitter:image:alt">` dengan nilai sama dengan `og:image:alt`

---

### 4. JSON-LD NewsArticle lengkap untuk Google News / Discover

**As a** Google bot yang mengindeks artikel,
**I want to** semua sinyal wajib ada di JSON-LD satu halaman,
**So that** artikel masuk Top Stories dan Google Discover.

#### Acceptance Criteria

WHEN halaman artikel dirender
THE SYSTEM SHALL mengemit JSON-LD `NewsArticle` dengan: `headline`, `image` (ImageObject 1200px), `datePublished`, `dateModified`, `author` (Person + url profil), `publisher` (@id #organization), `mainEntityOfPage`

WHEN halaman artikel dirender
THE SYSTEM SHALL mengemit JSON-LD `BreadcrumbList` dengan 3 item: Beranda → Kategori → Judul Artikel

WHEN halaman artikel dirender
THE SYSTEM SHALL mengemit JSON-LD `WebSite` agar referensi `isPartOf: { "@id": "#website" }` di NewsArticle tidak dangling

WHEN artikel memiliki `source_url`
THE SYSTEM SHALL menambahkan `isBasedOn: { "@type": "CreativeWork", url: source_url, name: source_name }` di NewsArticle

WHEN artikel memiliki `modified_at`
THE SYSTEM SHALL menggunakan `modified_at` untuk `dateModified`, fallback ke `updated_at` lalu `published_at`

---

### 5. Halaman profil penulis menampilkan bio dan daftar artikel

**As a** pembaca yang penasaran dengan penulis artikel,
**I want to** bisa buka halaman profil yang menampilkan bio, foto, dan artikel-artikelnya,
**So that** saya bisa mengikuti liputan dari penulis favorit.

#### Acceptance Criteria

WHEN pembaca membuka `/profile/{slug}`
THE SYSTEM SHALL menampilkan foto avatar, nama, role/jabatan, bio, dan link sosial media penulis

WHEN penulis memiliki artikel yang diterbitkan
THE SYSTEM SHALL menampilkan daftar artikel dengan thumbnail, judul, kategori, tanggal terbit, dan label `content_type` jika ada

WHEN daftar artikel lebih dari satu halaman
THE SYSTEM SHALL menyediakan tombol "Muat lebih banyak" yang fetch halaman berikutnya tanpa reload

WHEN halaman profil dirender server-side
THE SYSTEM SHALL mengemit JSON-LD `Person` dengan nama, url, jobTitle, dan deskripsi

---

### 6. Tag non-standar tidak mengganggu validasi

**As a** developer yang menjalankan audit HTML/SEO,
**I want to** `<head>` bebas dari tag yang tidak diakui standar,
**So that** tidak ada warning validator dan skor Best Practices Lighthouse tidak turun.

#### Acceptance Criteria

WHEN halaman mana pun dirender
THE SYSTEM SHALL TIDAK mengemit `<link rel="ard">` (non-standar, pengganti: `/.well-known/ard.json` sudah cukup via well-known discovery)

WHEN halaman mana pun dirender
THE SYSTEM SHALL TIDAK mengemit `<meta name="telegram:channel">` (tidak ada standar resmi)
