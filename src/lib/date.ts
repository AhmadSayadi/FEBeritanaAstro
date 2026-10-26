/**
 * Date formatting helpers — SELALU pakai timezone Asia/Jakarta (WIB).
 *
 * Kenapa penting: komponen server (Vercel = UTC) dan browser user (WIB = UTC+7)
 * bisa menghasilkan string tanggal berbeda kalau timezone tidak dikunci,
 * menyebabkan hydration mismatch (React error #418), terutama untuk artikel
 * yang terbit dekat tengah malam. Dengan mengunci timeZone, output selalu
 * identik di server maupun client.
 */

const TZ = 'Asia/Jakarta'

/**
 * Parse tanggal dari backend menjadi Date yang benar.
 *
 * Backend mengirim dua format:
 *  - ISO-8601 (mis. "2026-09-03T05:00:00Z" atau "...+07:00") → aman diparse langsung
 *  - "Y-m-d H:i:s" waktu WIB tanpa penanda timezone (mis. "2026-09-03 05:00:00")
 *    → new Date() akan salah menganggapnya waktu lokal browser. Kita perlakukan
 *      eksplisit sebagai WIB (+07:00) agar konsisten di server (UTC) & client.
 */
export function parseApiDate(dateString: string): Date {
  if (!dateString) return new Date(NaN)
  // Sudah ISO (ada 'T' dan/atau offset/Z) → parse langsung
  if (dateString.includes('T') || /[zZ]|[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString)
  }
  // Format "Y-m-d H:i:s" → anggap WIB (+07:00)
  const iso = dateString.trim().replace(' ', 'T') + '+07:00'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date(dateString) : d
}

/** Waktu relatif dalam Bahasa Indonesia (mis. "10 menit lalu"). */
export function timeAgoID(dateString: string): string {
  const date = parseApiDate(dateString)
  if (isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return '1 hari lalu'
  return `${diffDays} hari lalu`
}

/** Tanggal lengkap: "Senin, 3 September 2026" */
export function formatDateID(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  })
}

/** Tanggal + jam: "Senin, 3 September 2026 pukul 14.30" */
export function formatDateTimeID(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}

/** Tanggal ringkas: "3 Sep 2026" */
export function formatDateShortID(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  })
}

/** Byline ringkas: "5 Okt 2026 10:23" (bulan singkat, tanpa hari, tanpa "pukul"). */
export function formatBylineDateTimeID(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const datePart = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  })
  const timePart = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).replace('.', ':')
  return `${datePart} ${timePart}`
}
