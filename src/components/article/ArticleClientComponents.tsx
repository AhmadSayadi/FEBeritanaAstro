'use client'

import dynamic from 'next/dynamic'

export const ReadingProgress = dynamic(
  () => import('@/components/ui/ReadingProgress').then(mod => ({ default: mod.ReadingProgress })),
  { ssr: false, loading: () => null }
)

export const LikeButton = dynamic(
  () => import('@/components/article/LikeButton').then(mod => ({ default: mod.LikeButton })),
  { ssr: false, loading: () => <div className="h-9 w-20 animate-pulse rounded-full bg-gray-100" /> }
)

export const BookmarkButton = dynamic(
  () => import('@/components/article/BookmarkButton').then(mod => ({ default: mod.BookmarkButton })),
  { ssr: false, loading: () => <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100" /> }
)

export const CommentSection = dynamic(
  () => import('@/components/article/CommentSection').then(mod => ({ default: mod.CommentSection })),
  { ssr: false, loading: () => <div className="mt-10 h-40 animate-pulse rounded-lg bg-gray-100" /> }
)

export const SocialProof = dynamic(
  () => import('@/components/article/SocialProof').then(mod => ({ default: mod.SocialProof })),
  { ssr: false, loading: () => <div className="h-5 w-40 animate-pulse rounded bg-gray-100" /> }
)

export const FontSizeToggle = dynamic(
  () => import('@/components/ui/FontSizeToggle').then(mod => ({ default: mod.FontSizeToggle })),
  { ssr: false, loading: () => null }
)

export const TextToSpeech = dynamic(
  () => import('@/components/article/TextToSpeech').then(mod => ({ default: mod.TextToSpeech })),
  { ssr: false, loading: () => null }
)

export const ReadingMode = dynamic(
  () => import('@/components/article/ReadingMode').then(mod => ({ default: mod.ReadingMode })),
  { ssr: false, loading: () => null }
)

export const HighlightShare = dynamic(
  () => import('@/components/article/HighlightShare').then(mod => ({ default: mod.HighlightShare })),
  { ssr: false, loading: () => null }
)

export const TraktirButton = dynamic(
  () => import('@/components/traktir/TraktirButton').then(mod => ({ default: mod.TraktirButton })),
  { ssr: false, loading: () => null }
)
