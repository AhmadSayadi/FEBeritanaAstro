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
import { useEffect, useState, useCallback } from 'react'

const isBrowser = typeof window !== 'undefined'

export function usePathname(): string {
  const [pathname, setPathname] = useState<string>(
    isBrowser ? window.location.pathname : '/'
  )

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
  const [params, setParams] = useState<URLSearchParams>(
    isBrowser ? new URLSearchParams(window.location.search) : new URLSearchParams()
  )

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

  return { push, replace, refresh, back, forward, prefetch }
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
