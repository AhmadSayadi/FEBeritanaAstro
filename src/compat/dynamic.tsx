/**
 * next/dynamic compatibility shim.
 *
 * Reproduces `dynamic(loader, { ssr, loading })`:
 *   - Wraps the loader in React.lazy and renders it inside <Suspense>.
 *   - `loading` → the Suspense fallback.
 *   - `ssr: false` → render nothing on the server and only mount after the
 *     component has hydrated on the client (matches Next's client-only dynamic
 *     imports, which is how the article page defers non-critical widgets).
 */
import React, { Suspense, lazy, useEffect, useState } from 'react'

type Loader<P> = () =>
  | Promise<{ default: React.ComponentType<P> }>
  | Promise<React.ComponentType<P>>

interface DynamicOptions {
  ssr?: boolean
  loading?: () => React.ReactNode
}

function normalize<P>(loader: Loader<P>): () => Promise<{ default: React.ComponentType<P> }> {
  return () =>
    Promise.resolve(loader()).then((mod) => {
      const m = mod as { default?: React.ComponentType<P> } | React.ComponentType<P>
      if (m && typeof m === 'object' && 'default' in m && m.default) {
        return { default: m.default }
      }
      return { default: m as React.ComponentType<P> }
    })
}

export default function dynamic<P extends object = Record<string, unknown>>(
  loader: Loader<P>,
  options: DynamicOptions = {}
): React.ComponentType<P> {
  const { ssr = true, loading } = options
  const Fallback = () => <>{loading ? loading() : null}</>

  // ─── ssr: false ───────────────────────────────────────────────────────────
  // Client-only widget. We deliberately AVOID React.lazy + <Suspense> here.
  //
  // Why: these components live inside an Astro island that is HYDRATED. During
  // hydration, React's production build treats a <Suspense> boundary far more
  // strictly than the dev build — if the boundary's fallback doesn't line up
  // byte-for-byte with the server-rendered markers, production throws a
  // hydration mismatch (minified React #418, args[]=HTML) and regenerates the
  // subtree, while the dev build stays silent. That's exactly the
  // production-only #418 we saw on article pages (mobile).
  //
  // Instead we render the SAME fallback on the server and on the client's first
  // render (no Suspense boundary at all), then load the real module in a
  // useEffect (client-only) and swap it in. First render is identical on both
  // sides → no mismatch. This preserves Next's `ssr:false` behaviour.
  if (!ssr) {
    const ClientOnly: React.FC<P> = (props) => {
      const [Comp, setComp] = useState<React.ComponentType<P> | null>(null)

      useEffect(() => {
        let alive = true
        normalize(loader)()
          .then((mod) => {
            if (alive) setComp(() => mod.default)
          })
          .catch(() => {
            /* leave the fallback in place on load failure */
          })
        return () => {
          alive = false
        }
      }, [])

      if (!Comp) return <Fallback />
      return <Comp {...(props as P)} />
    }
    return ClientOnly as React.ComponentType<P>
  }

  // ─── ssr: true (default) ────────────────────────────────────────────────
  // Server-rendered. React.lazy + Suspense is fine here because the component
  // is part of the SSR output and its markup matches on hydration.
  const LazyComp = lazy(normalize(loader))
  const DynamicComponent: React.FC<P> = (props) => (
    <Suspense fallback={<Fallback />}>
      <LazyComp {...(props as P)} />
    </Suspense>
  )
  return DynamicComponent as React.ComponentType<P>
}
