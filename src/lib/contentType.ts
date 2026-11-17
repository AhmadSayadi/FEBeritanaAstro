/**
 * Metadata visual per content_type artikel.
 * Dipakai oleh ArticleHeader (byline) dan AuthorProfilePage (daftar artikel).
 */
import type { Article } from '@/lib/types'

export interface ContentTypeMeta {
  label: string
  className: string
}

export const CONTENT_TYPE_META: Record<
  NonNullable<Article['content_type']>,
  ContentTypeMeta
> = {
  berita:      { label: 'Berita',      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  analisis:    { label: 'Analisis',    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  opini:       { label: 'Opini',       className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  adaptasi:    { label: 'Adaptasi',    className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  advertorial: { label: 'Advertorial', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  kreatif:     { label: 'Kreatif',     className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' },
}

/** Kembalikan meta label content_type, atau null jika tidak ada. */
export function getContentTypeMeta(type: Article['content_type']): ContentTypeMeta | null {
  return type ? (CONTENT_TYPE_META[type] ?? null) : null
}
