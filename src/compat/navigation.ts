/**
 * next/navigation compatibility shim for Astro (client islands).
 *
 * Implements the App-Router navigation hooks against the browser's
 * History API + location. On the server (SSR) they return safe defaults.
 *
 * Supported:
 *   usePathname, useSearchParams, useRouter, useParams, redirect, notFound,
 *   permanentRedirect, useSelectedLayoutSegment(s)
 */
import { useEffect, useState, useCallback, useMemo } from 'react'

const isBrowser = typeof window !== 'undefined'

export function usePathname(): string {
  // IMPORTANT (hydration): the initializer runs on BOTH the SSR pass and the
  // client's FIRST render. If we read window.location.pathname here, SSR gives
  // '/' but the first client render gives the real path → React hydration
  // mismatch (error #418) on every non-home page for any island that renders
  // based on pathname (e.g. BottomNav active state). So we MUST start with the
  // same value the server used ('/') and only switch to the real path AFTER
  // mount, in useEffect. This two-pass render keeps the first client render
  // byte-identical to the server HTML.
  const [pathname, setPathname] = useState<string>('/')

  useEffect(() => {
    if (!isBrowser) return
    const update = () => setPathname(window.location.pathname)
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  return pathname
}

export function useSearchParams(): URLSearchParams {
  // Same two-pass rule as usePathname: start empty (SSR-safe), read the real
  // query string only after mount, so the first client render matches the SSR
  // HTML and doesn't trigger a hydration mismatch.
  const [params, setParams] = useState<URLSearchParams>(new URLSearchParams())

  useEffect(() => {
    if (!isBrowser) return
    const update = () => setParams(new URLSearchParams(window.location.search))
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  return params
}

export interface AppRouterInstance {
  push: (href: string, options?: { scroll?: boolean }) => void
  replace: (href: string, options?: { scroll?: boolean }) => void
  refresh: () => void
  back: () => void
  forward: () => void
  prefetch: (href: string) => void
}

export function useRouter(): AppRouterInstance {
  const push = useCallback((href: string) => {
    if (isBrowser) window.location.assign(href)
  }, [])
  const replace = useCallback((href: string) => {
    if (isBrowser) window.location.replace(href)
  }, [])
  const refresh = useCallback(() => {
    if (isBrowser) window.location.reload()
  }, [])
  const back = useCallback(() => {
    if (isBrowser) window.history.back()
  }, [])
  const forward = useCallback(() => {
    if (isBrowser) window.history.forward()
  }, [])
  const prefetch = useCallback(() => {
    /* no-op: MPA navigation */
  }, [])

  // Return a STABLE object reference. Without useMemo, useRouter() returns a
  // fresh object literal every render, so any `useEffect(..., [router])` re-runs
  // on every render → re-fetch → setState → re-render → infinite loop (this
  // caused /tulis to fire thousands of /api/tags-list + /api/categories-list
  // requests). The callbacks are already stable via useCallback, so this memo
  // never recomputes after mount.
  return useMemo(
    () => ({ push, replace, refresh, back, forward, prefetch }),
    [push, replace, refresh, back, forward, prefetch]
  )
}

/**
 * useParams — in Next this reads dynamic route params. Under Astro, client
 * islands don't receive route params automatically, so we parse them from the
 * pathname when possible and allow pages to seed params via a global set by
 * the island wrapper (window.__ASTRO_PARAMS__).
 */
export function useParams<T extends Record<string, string | string[]> = Record<string, string | string[]>>(): T {
  const [params, setParams] = useState<T>(() => readGlobalParams<T>())
  useEffect(() => {
    setParams(readGlobalParams<T>())
  }, [])
  return params
}

function readGlobalParams<T>(): T {
  if (isBrowser) {
    const g = (window as unknown as { __ASTRO_PARAMS__?: unknown }).__ASTRO_PARAMS__
    if (g && typeof g === 'object') return g as T
  }
  return {} as T
}

export function redirect(href: string): never {
  if (isBrowser) window.location.assign(href)
  throw new Error(`NEXT_REDIRECT:${href}`)
}

export function permanentRedirect(href: string): never {
  return redirect(href)
}

export function notFound(): never {
  if (isBrowser) window.location.assign('/404')
  throw new Error('NEXT_NOT_FOUND')
}

export function useSelectedLayoutSegment(): string | null {
  return null
}

export function useSelectedLayoutSegments(): string[] {
  return []
}

export function useServerInsertedHTML(): void {
  /* no-op */
}
