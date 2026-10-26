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
  const LazyComp = lazy(normalize(loader))
  const Fallback = () => <>{loading ? loading() : null}</>

  const DynamicComponent: React.FC<P> = (props) => {
    const [mounted, setMounted] = useState(ssr)

    useEffect(() => {
      if (!ssr) setMounted(true)
    }, [])

    if (!mounted) {
      // ssr:false → render the loading fallback until mounted on the client.
      return <Fallback />
    }

    return (
      <Suspense fallback={<Fallback />}>
        <LazyComp {...(props as P)} />
      </Suspense>
    )
  }

  return DynamicComponent as React.ComponentType<P>
}
