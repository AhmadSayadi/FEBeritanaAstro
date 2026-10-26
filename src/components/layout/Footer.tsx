import Link from '@/compat/Link'
import { getSiteConfig, type SiteConfig } from '@/lib/site-config'

// Async data wrapper — preserved for any server-side importer.
export async function Footer() {
  const config = await getSiteConfig()
  return <FooterView config={config} />
}

// Presentational component — identical markup, receives config as a prop.
// Rendered from Astro (Footer.astro) which awaits getSiteConfig() itself,
// because Astro's React renderer cannot render async components.
export function FooterView({ config }: { config: SiteConfig }) {
  // Filter only social links that exist
  const socials = [
    { url: config.facebook_url, label: 'Facebook', icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' },
    { url: config.twitter_url, label: 'Twitter', icon: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
    { url: config.instagram_url, label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
    { url: config.youtube_url, label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { url: config.linkedin_url, label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { url: config.tiktok_url, label: 'TikTok', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  ].filter(s => s.url && s.url.trim() !== '' && s.url !== '#')

  // Top 3 categories for News column
  const newsCategories = (config.categories || []).slice(0, 4)

  return (
    <footer className="bg-dark text-gray-300">
      <div className="container-main py-10 sm:py-12">
        {/* Top section - Logo + Newsletter */}
        <div className="flex flex-col gap-6 border-b border-gray-800 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold text-white">
              {config.site_name}
            </Link>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
              {config.footer_description}
            </p>
            {/* Kontak redaksi — sinyal Trust (E-E-A-T) untuk Google News */}
            <address className="mt-3 space-y-1 text-sm not-italic text-gray-400">
              {config.contact_address && (
                <p>{config.contact_address}</p>
              )}
              {config.contact_email && (
                <p>
                  Redaksi:{' '}
                  <a href={`mailto:${config.contact_email}`} className="hover:text-white">
                    {config.contact_email}
                  </a>
                </p>
              )}
              {config.contact_phone && (
                <p>
                  Telp:{' '}
                  <a href={`tel:${config.contact_phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                    {config.contact_phone}
                  </a>
                </p>
              )}
            </address>
          </div>

          {/* Newsletter */}
          <div className="w-full sm:max-w-sm">
            <h3 className="mb-2 text-sm font-bold uppercase text-white">Newsletter</h3>
            <form className="flex gap-2" action="/api/newsletter/subscribe" method="post">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                name="email"
                type="email"
                placeholder="Email address"
                className="min-w-0 flex-1 rounded bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button type="submit" className="btn-primary shrink-0">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 gap-6 pt-8 sm:grid-cols-4">
          {/* Tentang — sinyal E-E-A-T (redaksi, pedoman, koreksi) */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase text-white">Tentang</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pages/tentang-kami" className="hover:text-white">Tentang Kami</Link></li>
              <li><Link href="/pages/redaksi" className="hover:text-white">Susunan Redaksi</Link></li>
              <li><Link href="/pages/pedoman-media-siber" className="hover:text-white">Pedoman Media Siber</Link></li>
            </ul>
          </div>

          {/* News categories — dynamic */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase text-white">Berita</h3>
            <ul className="space-y-2 text-sm">
              {newsCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/${cat.slug}`} className="hover:text-white">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kebijakan */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase text-white">Kebijakan</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pages/privacy-policy" className="hover:text-white">Kebijakan Privasi</Link></li>
              <li><Link href="/pages/terms-of-use" className="hover:text-white">Terms of Use</Link></li>
              <li><Link href="/pages/kebijakan-iklan" className="hover:text-white">Kebijakan Iklan</Link></li>
              <li><Link href="/pages/contact" className="hover:text-white">Hubungi Kami</Link></li>
              <li>
                <Link href="/rss-feeds" className="hover:text-white">
                  RSS Feeds
                </Link>
              </li>
            </ul>
          </div>

          {/* Social — dynamic from config */}
          {socials.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase text-white">Sosial</h3>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-light text-gray-400 transition-colors hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={s.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container-main py-4 text-center text-xs text-gray-400">
          {config.footer_copyright || `© ${new Date().getFullYear()} ${config.site_name}. All rights reserved.`}
        </div>
      </div>
    </footer>
  )
}
