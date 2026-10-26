/**
 * next/font/google compatibility shim.
 *
 * In Next, calling e.g. `Plus_Jakarta_Sans({ variable: '--font-inter' })`
 * self-hosts the font and returns an object exposing `.variable`, `.className`
 * and `.style`. Under Astro we load the font via a <link> tag in the base
 * layout (BaseHead.astro) and bind the CSS variable there. This shim returns
 * an object with the same shape so any component calling a Google-font factory
 * continues to work. The returned `variable` class simply activates the CSS
 * custom property defined globally.
 */

interface FontOptions {
  subsets?: string[]
  weight?: string | string[]
  style?: string | string[]
  display?: string
  variable?: string
  preload?: boolean
  fallback?: string[]
  adjustFontFallback?: boolean
}

interface FontResult {
  className: string
  variable: string
  style: { fontFamily: string }
}

function makeFont(options: FontOptions = {}): FontResult {
  // The CSS variable is defined in globals.css / BaseHead; we expose a class
  // name derived from the requested variable so `className={font.variable}`
  // keeps working. The class itself is a no-op marker (the variable is set
  // globally on <html>), which preserves identical rendering.
  const variableClass = options.variable
    ? `font-var${options.variable.replace(/[^a-zA-Z0-9]/g, '-')}`
    : ''
  return {
    className: variableClass,
    variable: variableClass,
    style: { fontFamily: 'var(--font-inter), sans-serif' },
  }
}

// Export every family name used across the codebase as the same factory.
// Add more here if other families get used.
export const Plus_Jakarta_Sans = makeFont
export const Inter = makeFont

// Generic default in case a component imports a differently-named family.
export default makeFont
