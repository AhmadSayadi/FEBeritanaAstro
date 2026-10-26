/**
 * next/image compatibility shim for Astro.
 *
 * The original Next config used `images.unoptimized: true`, serving images
 * as-is. We render a plain <img> with the same attributes, preserving markup,
 * lazy-loading, priority (fetchpriority), blur placeholder, and SEO.
 *
 * Responsive upgrade (safe, opt-out via NEXT_PUBLIC_CDN_RESIZE): when the src is
 * a Cloudflare-proxied CDN image and the caller didn't supply its own srcSet,
 * we auto-generate a `srcset` via Cloudflare Image Resizing (format=auto →
 * AVIF/WebP) plus a sensible default `sizes`. When resizing is off, or for
 * non-CDN images, this is a no-op and the plain <img> renders exactly as before.
 */
import React from 'react'
import { getImageSrcSet } from '@/lib/api'

type StaticImport = { src: string; width?: number; height?: number; blurDataURL?: string }

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'loading' | 'ref'> {
  src: string | StaticImport
  alt: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number | string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  unoptimized?: boolean
  sizes?: string
  onLoadingComplete?: (img: HTMLImageElement) => void
  onLoad?: React.ReactEventHandler<HTMLImageElement>
  onError?: React.ReactEventHandler<HTMLImageElement>
}

function resolveSrc(src: string | StaticImport): string {
  return typeof src === 'string' ? src : src.src
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    src,
    alt,
    width,
    height,
    fill,
    priority,
    loading,
    quality,
    placeholder,
    blurDataURL,
    unoptimized,
    sizes,
    style,
    onLoadingComplete,
    onLoad,
    ...rest
  },
  ref
) {
  void quality
  void unoptimized

  const resolvedSrc = resolveSrc(src)

  // Auto responsive srcSet via Cloudflare Image Resizing — only when the caller
  // didn't pass its own srcSet. getImageSrcSet() returns '' for non-CDN URLs or
  // when resizing is disabled, so this stays a no-op in those cases.
  const callerSrcSet = (rest as { srcSet?: string }).srcSet
  const autoSrcSet = callerSrcSet ? undefined : getImageSrcSet(resolvedSrc) || undefined
  // Default `sizes` so the browser can pick the right candidate. If the caller
  // gave an explicit `sizes` we keep it; otherwise assume full-width-ish, which
  // is a safe superset for cards/hero (never downloads larger than needed).
  const resolvedSizes =
    sizes || (autoSrcSet ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1280px' : undefined)

  // Blur placeholder → show as background until the image loads.
  const blur =
    typeof src === 'object' && src.blurDataURL ? src.blurDataURL : blurDataURL

  const fillStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        inset: 0,
        objectFit: (style?.objectFit as React.CSSProperties['objectFit']) || 'cover',
        color: 'transparent',
      }
    : {}

  const placeholderStyle: React.CSSProperties =
    placeholder === 'blur' && blur
      ? {
          backgroundImage: `url("${blur}")`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 50%',
          backgroundRepeat: 'no-repeat',
        }
      : {}

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    if (placeholder === 'blur') {
      e.currentTarget.style.backgroundImage = 'none'
    }
    onLoadingComplete?.(e.currentTarget)
    onLoad?.(e)
  }

  return (
    <img
      ref={ref}
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : (width as number | undefined)}
      height={fill ? undefined : (height as number | undefined)}
      loading={priority ? 'eager' : loading || 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      sizes={resolvedSizes}
      srcSet={autoSrcSet}
      style={{ ...placeholderStyle, ...fillStyle, ...style }}
      onLoad={handleLoad}
      {...rest}
    />
  )
})

export default Image
