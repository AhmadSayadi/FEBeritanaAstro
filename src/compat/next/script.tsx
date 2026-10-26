/**
 * next/script compatibility shim.
 *
 * Renders a standard <script>. `strategy` is accepted for API compatibility;
 * we map it to native loading hints:
 *   - beforeInteractive / afterInteractive → normal (or async) script
 *   - lazyOnload → defer
 * Inline scripts (children) are rendered via dangerouslySetInnerHTML, matching
 * how Next emits inline <Script id="...">{`...`}</Script>.
 */
import React from 'react'

export type ScriptStrategy =
  | 'beforeInteractive'
  | 'afterInteractive'
  | 'lazyOnload'
  | 'worker'

export interface ScriptProps
  extends Omit<React.ScriptHTMLAttributes<HTMLScriptElement>, 'children'> {
  strategy?: ScriptStrategy
  children?: string
  onLoad?: () => void
  onReady?: () => void
  onError?: () => void
}

export default function Script({
  strategy = 'afterInteractive',
  children,
  src,
  onLoad,
  onReady,
  onError,
  ...rest
}: ScriptProps) {
  void onLoad
  void onReady
  void onError

  const defer = strategy === 'lazyOnload'
  const async = strategy === 'afterInteractive' || strategy === 'worker'

  if (children) {
    return (
      <script {...rest} dangerouslySetInnerHTML={{ __html: children }} />
    )
  }

  return <script src={src} async={async} defer={defer} {...rest} />
}
