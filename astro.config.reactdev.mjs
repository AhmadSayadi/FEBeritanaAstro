/**
 * TEMPORARY DIAGNOSTIC CONFIG — do not keep in production.
 *
 * Builds the production site but with React's DEVELOPMENT bundle, so hydration
 * mismatches print the exact element/attribute in the console (instead of the
 * minified "React error #418"). Reverted once the homepage mismatch is found.
 */
import base from './astro.config.mjs'

export default {
  ...base,
  vite: {
    ...base.vite,
    define: {
      ...base.vite.define,
      'process.env.NODE_ENV': '"development"',
      // Flip on our own verbose hydration tracing (see src/lib/hydration-trace.ts).
      'process.env.PUBLIC_HYDRATION_TRACE': '"1"',
    },
    build: { ...(base.vite.build || {}), minify: false },
  },
}
