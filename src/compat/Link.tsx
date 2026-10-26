/**
 * next/link compatibility shim for Astro.
 *
 * Next's <Link> does client-side navigation. Under Astro (MPA), a plain
 * anchor performs a normal navigation, which is the correct behaviour for a
 * content site and keeps SEO/crawlability identical. The API surface is kept
 * compatible so components importing `next/link` work unchanged.
 */
import React from 'react'

type Url = string | { pathname?: string; query?: Record<string, string | number | undefined>; hash?: string }

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: Url
  // Next-only props — accepted and ignored so JSX stays identical.
  prefetch?: boolean | null
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  legacyBehavior?: boolean
  locale?: string | false
  as?: Url
  children?: React.ReactNode
}

function hrefToString(href: Url): string {
  if (typeof href === 'string') return href
  const path = href.pathname || ''
  const query = href.query
    ? '?' +
      Object.entries(href.query)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  const hash = href.hash ? `#${href.hash}` : ''
  return `${path}${query}${hash}`
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    children,
    // strip Next-only props
    prefetch,
    replace,
    scroll,
    shallow,
    passHref,
    legacyBehavior,
    locale,
    as,
    ...rest
  },
  ref
) {
  void prefetch
  void replace
  void scroll
  void shallow
  void passHref
  void legacyBehavior
  void locale
  void as
  return (
    <a ref={ref} href={hrefToString(href)} {...rest}>
      {children}
    </a>
  )
})

export default Link
