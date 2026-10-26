/**
 * Traktir Kopi — helper logika murni (isomorphic).
 *
 * Berisi: pengambilan config, format rupiah, serialisasi/parse Donation_Context
 * untuk return URL, validasi redirect internal, dan pemetaan pesan error.
 *
 * Konfigurasi fitur berasal dari SiteConfig (/api/settings) yang dikelola admin
 * Laravel. Kegagalan apa pun diperlakukan sebagai fitur NONAKTIF.
 */

import { getSiteConfig } from './site-config'
import type { TraktirConfig, DonationContext } from './types'

const INACTIVE_CONFIG: TraktirConfig = {
  active: false,
  payment_provider: 'static_qris',
  qris_image_url: null,
  coffee_options: [],
}

function normalizeConfig(tk: TraktirConfig | undefined | null): TraktirConfig {
  if (!tk || typeof tk.active !== 'boolean') return INACTIVE_CONFIG
  return {
    active: tk.active,
    payment_provider: tk.payment_provider === 'duitku' ? 'duitku' : 'static_qris',
    qris_image_url: tk.qris_image_url ?? null,
    coffee_options: Array.isArray(tk.coffee_options) ? tk.coffee_options : [],
  }
}

/**
 * Ambil TraktirConfig. Membungkus kegagalan apa pun menjadi config nonaktif.
 * (Property 3: kegagalan pengambilan config menghasilkan fitur nonaktif.)
 *
 * Di CLIENT: env server-only (API_BASE_URL/API_SECRET_KEY) tidak tersedia, jadi
 * ambil lewat route proxy publik /api/traktir/config.
 * Di SERVER: panggil getSiteConfig() langsung.
 */
export async function getTraktirConfig(): Promise<TraktirConfig> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/traktir/config')
      if (!res.ok) return INACTIVE_CONFIG
      return normalizeConfig((await res.json()) as TraktirConfig)
    }
    const site = await getSiteConfig()
    return normalizeConfig(site.traktir_kopi)
  } catch {
    return INACTIVE_CONFIG
  }
}

/**
 * Format nominal rupiah tanpa desimal, mis. 10000 → "Rp10.000".
 */
export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe)
  // Intl memakai "Rp\u00a010.000" (ada NBSP). Normalkan ke "Rp10.000".
  return formatted.replace(/\s/g, '')
}

/** Path route Payment_Stage. */
export const TRAKTIR_PATH = '/traktir'

/**
 * Bangun return URL (Payment_Stage) dari Donation_Context.
 * Semua nilai di-encode agar aman terhadap karakter spesial.
 */
export function buildReturnUrl(ctx: DonationContext): string {
  const params = new URLSearchParams({
    article: ctx.articleSlug,
    title: ctx.articleTitle,
    author: ctx.authorSlug,
    authorName: ctx.authorName,
    cups: String(ctx.cups),
    amount: String(ctx.amount),
  })
  return `${TRAKTIR_PATH}?${params.toString()}`
}

/**
 * Parse Donation_Context dari sebuah URL (atau query string) Payment_Stage.
 * Mengembalikan null bila konteks tidak valid (mis. penulis/artikel kosong).
 * (Property 4: round-trip buildReturnUrl → parseDonationContext identik.)
 */
export function parseDonationContext(url: string): DonationContext | null {
  const queryIndex = url.indexOf('?')
  const query = queryIndex >= 0 ? url.slice(queryIndex + 1) : url
  const params = new URLSearchParams(query)

  const articleSlug = params.get('article') ?? ''
  const articleTitle = params.get('title') ?? ''
  const authorSlug = params.get('author') ?? ''
  const authorName = params.get('authorName') ?? ''
  const cups = Number(params.get('cups'))
  const amount = Number(params.get('amount'))

  if (!authorSlug || !articleSlug) return null
  if (!Number.isFinite(cups) || !Number.isFinite(amount)) return null
  if (cups <= 0 || amount <= 0) return null

  return { articleSlug, articleTitle, authorSlug, authorName, cups, amount }
}

/**
 * Validasi apakah sebuah string merupakan path internal aplikasi yang aman
 * sebagai tujuan redirect setelah login.
 *
 * Aman bila: diawali tepat satu "/", BUKAN "//" (protocol-relative), dan tidak
 * mengandung skema absolut (http:, https:, javascript:, data:, dll.).
 * (Property 5 + mitigasi open-redirect.)
 */
export function isSafeInternalPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.startsWith('/\\')) return false // "/\" diperlakukan browser seperti "//"
  // Tolak skema absolut di mana pun (mis. "/redirect?x=javascript:...")
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false
  return true
}

/**
 * Petakan error apa pun menjadi pesan ramah berbahasa Indonesia.
 * Tidak pernah membocorkan pesan/stack teknis mentah ke pengguna.
 * (Property 9.)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mapErrorToMessage(_error?: unknown): string {
  return 'Gagal memuat data. Silakan coba lagi.'
}

/** Kumpulan pesan Bahasa Indonesia yang dipakai lintas komponen. */
export const TRAKTIR_MESSAGES = {
  featureUnavailable: 'Fitur Traktir Kopi sedang tidak tersedia.',
  qrisUnavailable: 'QRIS belum tersedia.',
  recipientUnavailable: 'Penerima donasi tidak tersedia.',
  loadFailed: 'Gagal memuat data. Silakan coba lagi.',
  emptyOptions: 'Opsi donasi belum tersedia.',
} as const
