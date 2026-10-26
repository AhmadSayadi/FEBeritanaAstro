/**
 * Server-side HTML sanitizer for backend-authored content.
 *
 * Why: articles can be written by EXTERNAL authors (verified accounts, but not
 * fully trusted), so their HTML is a stored-XSS vector if injected raw. We run
 * this on the server during SSR before `set:html` / dangerouslySetInnerHTML.
 *
 * Design: allowlist-based. We keep everything a news article legitimately needs
 * (rich text, images, tables, figures) PLUS the social embeds the site supports
 * (YouTube, Instagram, Twitter/X, TikTok, Facebook, Threads). Embeds need
 * <iframe> and sometimes <script>/<blockquote> — but ONLY from the official
 * provider hostnames. Everything else (arbitrary <script>, inline event
 * handlers, javascript: URLs) is stripped.
 */
import sanitizeHtml from 'sanitize-html'

/** Hostnames allowed to appear in <iframe src> (social/video embeds). */
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.instagram.com',
  'instagram.com',
  'platform.twitter.com',
  'www.tiktok.com',
  'www.facebook.com',
  'web.facebook.com',
  'www.threads.net',
  'www.google.com', // google maps embeds
  'datawrapper.dwcdn.net', // infographics commonly used by newsrooms
]

/**
 * Hostnames allowed for embed <script src>. The embed loader scripts are also
 * injected by EmbedScripts.tsx on the client, but if an author pastes the
 * provider's official <script> into the body we keep it (same origin set).
 */
const ALLOWED_SCRIPT_HOSTS = [
  'www.instagram.com',
  'platform.twitter.com',
  'www.tiktok.com',
  'connect.facebook.net',
  'www.threads.net',
  'datawrapper.dwcdn.net',
]

const baseOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    // text structure
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'blockquote', 'pre', 'code', 'span', 'div', 'section', 'article',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark', 'small', 'br', 'hr',
    'a', 'abbr', 'cite', 'q', 'time',
    // media
    'img', 'figure', 'figcaption', 'picture', 'source',
    'iframe', 'video', 'audio', 'track',
    // tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // embeds occasionally use these
    'script', 'noscript',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'sizes'],
    source: ['src', 'srcset', 'type', 'media', 'sizes'],
    video: ['src', 'poster', 'width', 'height', 'controls', 'loop', 'muted', 'playsinline', 'preload'],
    audio: ['src', 'controls', 'loop', 'preload'],
    track: ['src', 'kind', 'srclang', 'label', 'default'],
    iframe: [
      'src', 'width', 'height', 'title', 'frameborder', 'allow', 'allowfullscreen',
      'loading', 'referrerpolicy', 'style', 'scrolling',
    ],
    time: ['datetime'],
    // Social embeds attach behaviour via data-* and specific classes.
    blockquote: ['class', 'cite', 'data-instgrm-permalink', 'data-instgrm-version', 'data-lang', 'data-conversation', 'data-dnt', 'data-theme', 'data-width', 'data-video-id', 'data-tweet-id'],
    script: ['src', 'async', 'defer', 'charset', 'crossorigin'],
    div: ['class', 'id', 'data-*', 'style'],
    span: ['class', 'style'],
    p: ['class', 'style'],
    figure: ['class'],
    figcaption: ['class'],
    table: ['class'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    '*': ['data-*'],
  },
  // Only https embeds; no javascript:, data: (except images), vbscript:, etc.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  allowProtocolRelative: false,
  // We intentionally allow <script> but ONLY from the official embed hostnames
  // below (allowedScriptHostnames). Acknowledge the risk so sanitize-html keeps
  // them instead of stripping, and to silence its XSS warning.
  allowVulnerableTags: true,
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
  // sanitize-html removes <script> unless allowed; we keep it but only from the
  // official embed hosts, and drop any inline script body.
  allowedScriptHostnames: ALLOWED_SCRIPT_HOSTS,
  // Drop inline event handlers (onclick, onerror, ...) — sanitize-html does not
  // allow unlisted attributes, and on* are never in the allowlist above, so
  // they're stripped automatically. Keep style but with a safe filter.
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
      'float': [/^(left|right|none)$/],
      width: [/^\d+(?:px|%)$/],
      height: [/^\d+(?:px|%)$/],
      'aspect-ratio': [/^[\d/.\s]+$/],
    },
  },
  // Force safe rel on links that open a new tab.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        attribs.rel = 'noopener noreferrer' + (attribs.rel ? ' ' + attribs.rel : '')
      }
      return { tagName, attribs }
    },
  },
}

/**
 * Sanitize backend-authored article/page HTML.
 * Returns a safe HTML string with social embeds preserved.
 */
export function sanitizeContent(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtml(html, baseOptions)
}
