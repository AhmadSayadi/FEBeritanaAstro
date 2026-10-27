'use client'

import Link from '@/compat/Link'
import Image from '@/compat/Image'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from '@/compat/navigation'
import { CategoryNav } from '@/lib/site-config'
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { getNavigation } from '@/lib/navigation-cache'

// Header logo served from the CDN. Fallback to the bundled local asset if the
// CDN request fails (see onError), so the logo never disappears.
const LOGO_CDN = 'https://cdn.beritana.com/logo/logo.webp'
const LOGO_LOCAL = '/images/logo.webp'

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [todayDate, setTodayDate] = useState('')
  const [cats, setCats] = useState<CategoryNav[]>([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [siteLogo, setSiteLogo] = useState(LOGO_CDN)
  const [socials, setSocials] = useState<{ facebook?: string; twitter?: string; instagram?: string; youtube?: string; tiktok?: string; linkedin?: string }>({})
  const pathname = usePathname()

  // Close search & mobile menu on route change
  useEffect(() => {
    setSearchOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  // Set date on client only to avoid hydration mismatch
  useEffect(() => {
    setTodayDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  // Fetch nav config on mount via the shared deduped cache (one network call
  // per tab, shared with BreakingNewsBanner/AdBanner).
  useEffect(() => {
    let active = true
    getNavigation()
      .then(data => {
        if (!active || !data) return
        const cats = (data.categories as CategoryNav[] | undefined) || []
        if (cats.length > 0) setCats((data.header_categories as CategoryNav[] | undefined) || cats)
        // Use API logo only if it exists & non-empty; otherwise keep the default.
        if (data.site_logo && typeof data.site_logo === 'string' && data.site_logo.trim() !== '') {
          setSiteLogo(data.site_logo)
        }
        if (data.social) setSocials(data.social)
      })
      .finally(() => { if (active) setCatsLoading(false) })
    return () => { active = false }
  }, [])

  // Hide top bar on scroll
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 120)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get active category from URL — works for /[slug] (category) AND /[category]/[slug] (article detail)
  const segments = pathname.split('/').filter(Boolean)
  let activeCategorySlug = ''

  if (segments.length === 1) {
    // Single segment: /{slug} — could be a category page
    const firstSeg = segments[0]
    const knownRoutes = ['profile', 'penulis', 'tag', 'berita', 'pencarian', 'tentang', 'kontak', 'kebijakan-privasi', 'pedoman', 'masuk', 'daftar', 'tulis', 'profil', 'api', 'video', 'foto', 'live', 'pages']
    if (!knownRoutes.includes(firstSeg) && cats.some(c => c.slug === firstSeg)) {
      activeCategorySlug = firstSeg
    }
  } else if (segments.length === 2) {
    // Two segments: /{category}/{article} — first is category
    const firstSeg = segments[0]
    const knownRoutes = ['profile', 'penulis', 'tag', 'berita', 'pencarian', 'tentang', 'kontak', 'kebijakan-privasi', 'pedoman', 'masuk', 'daftar', 'tulis', 'profil', 'api', 'video', 'foto', 'live', 'pages']
    if (!knownRoutes.includes(firstSeg) && cats.some(c => c.slug === firstSeg)) {
      activeCategorySlug = firstSeg
    }
  }

  const activeCat = cats.find(c => c.slug === activeCategorySlug)
  // In dark mode, don't use category colors — keep uniform dark
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const categoryColor = isDark ? null : (activeCat?.color || null)

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <>
      <header className={`sticky z-40 bg-white shadow-sm transition-[top] duration-300 ${scrolled ? 'top-[-60px] lg:top-[-60px]' : 'top-0'}`}>
        {/* Mobile sticky bar — hidden since top bar always visible on mobile */}

        {/* Top bar — logo + date + social (hides on scroll on DESKTOP only) */}
        <div className={`border-b border-gray-100`}>
          <div className="container-main flex items-center justify-between py-3">
            {/* Hamburger mobile */}
            <button
              aria-label="Buka menu navigasi"
              className="p-2 text-gray-600 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo + active category */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/">
                <Image
                  src={siteLogo}
                  alt="Beritana"
                  width={180}
                  height={36}
                  className="h-8 w-auto sm:h-9"
                  loading="eager"
                  fetchPriority="low"
                  unoptimized
                  onError={() => setSiteLogo(LOGO_LOCAL)}
                />
              </Link>
              {activeCat && (
                <span
                  className="cat-badge rounded px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: activeCat.color || '#E53935' }}
                >
                  {activeCat.name}
                </span>
              )}
            </div>

            {/* Center — date only */}
            <div className="hidden items-center gap-5 lg:flex">
              <span className="text-sm text-gray-500">
                {todayDate}
              </span>
            </div>

            {/* Right side — search + social + user */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <button
                aria-label="Buka pencarian"
                className="p-2 text-gray-600 hover:text-primary"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Social icons — desktop only, dynamic from settings */}
              <div className="hidden items-center gap-2 sm:flex">
                {socials.facebook && (
                  <a href={socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-500 hover:text-gray-900">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                  </a>
                )}
                {socials.twitter && (
                  <a href={socials.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-500 hover:text-gray-900">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {socials.instagram && (
                  <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-500 hover:text-gray-900">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {socials.youtube && (
                  <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-500 hover:text-gray-900">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {socials.tiktok && (
                  <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-gray-500 hover:text-gray-900">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </a>
                )}
              </div>

              {/* User menu */}
              <DarkModeToggle />
              <UserMenuButton />
            </div>
          </div>
        </div>

        {/* Category bar — desktop only */}
        <div
          className="hidden shadow-md transition-colors duration-300 lg:block"
          style={categoryColor ? { backgroundColor: categoryColor } : undefined}
        >
          <nav aria-label="Navigasi kategori" className={`container-main relative ${!categoryColor ? 'bg-white dark:bg-gray-800' : ''}`}>
            {catsLoading ? (
              <div className="flex items-center gap-5 py-2.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-4 w-20 rounded bg-gray-200/50 dark:bg-gray-700" />
                ))}
              </div>
            ) : (
              <CategoryNavBar cats={cats} activeCategorySlug={activeCategorySlug} categoryColor={categoryColor} />
            )}
          </nav>
        </div>

        {/* Search bar with autocomplete */}
        {searchOpen && (
          <div className="border-t border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="container-main py-3">
              <SearchAutocomplete />
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <nav aria-label="Menu mobile" className="absolute left-0 top-0 h-full w-full overflow-y-auto bg-white text-gray-900 dark:bg-dark dark:text-white sm:w-80">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Image src={LOGO_CDN} alt="beritana" width={140} height={28} className="h-7 w-auto dark:brightness-0 dark:invert" />
              </Link>
              <button aria-label="Tutup menu" className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Categories — 2 column grid */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {cats.sort((a, b) => a.order - b.order).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    className="text-sm font-bold uppercase tracking-wide text-gray-800 hover:text-primary dark:text-gray-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-200 dark:border-gray-700" />

            {/* Pages */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Link href="/pages/tentang-kami" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>Tentang Kami</Link>
                <Link href="/pages/contact" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>Hubungi Kami</Link>
                <Link href="/tulis" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>Tulis Artikel</Link>
                <Link href="/pages/pedoman-media-siber" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>Pedoman</Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

function CategoryNavBar({ cats, activeCategorySlug, categoryColor }: { cats: CategoryNav[]; activeCategorySlug: string; categoryColor: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(cats.length)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const sorted = [...cats].sort((a, b) => a.order - b.order)
  const visible = sorted.slice(0, visibleCount)
  const overflow = sorted.slice(visibleCount)

  // Measure on mount, on resize, and when cats change
  useEffect(() => {
    if (cats.length === 0) return

    // Reset to show all first, then measure
    setVisibleCount(cats.length)

    const measure = () => {
      const container = containerRef.current
      if (!container) return

      // Available width minus the "more" button reserve (40px)
      const containerWidth = container.offsetWidth - 40
      const items = container.querySelectorAll<HTMLElement>('[data-cat-item]')

      // If everything fits, show all
      let totalWidth = 0
      items.forEach((item) => {
        totalWidth += item.offsetWidth + 20 // 20px gap
      })
      if (totalWidth <= container.offsetWidth) {
        setVisibleCount(cats.length)
        return
      }

      // Otherwise count how many fit
      totalWidth = 0
      let count = 0
      items.forEach((item) => {
        totalWidth += item.offsetWidth + 20
        if (totalWidth < containerWidth) count++
      })

      setVisibleCount(Math.max(count, 3))
    }

    // Run after DOM is painted
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [cats])

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Visible categories */}
      <ul className="flex items-center gap-5 py-2.5 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
        {visible.map((cat) => {
          const isActive = cat.slug === activeCategorySlug
          return (
            <li key={cat.slug} data-cat-item>
              <Link
                href={`/${cat.slug}`}
                className={`transition-all ${
                  categoryColor
                    ? (isActive ? 'text-white border-b-2 border-white pb-0.5' : 'text-white/80 hover:text-white')
                    : (isActive ? 'text-primary border-b-2 border-primary pb-0.5' : 'text-gray-800 dark:text-gray-200 hover:text-primary')
                }`}
              >
                {cat.name}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* More button — only show if there are overflow items */}
      {overflow.length > 0 && (
        <div className="relative ml-3">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label={`${overflow.length} kategori lainnya`}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: categoryColor ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
              color: categoryColor ? '#fff' : '#374151',
            }}
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {overflow.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function UserMenuButton() {
  const [user, setUser] = useState<{ name: string; avatar_url: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const checkUser = () => {
      const data = localStorage.getItem('beritana_user')
      if (data) {
        try { setUser(JSON.parse(data)) } catch { setUser(null) }
      } else {
        setUser(null)
      }
    }
    checkUser()
    const interval = setInterval(checkUser, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!user) {
    return (
      <Link href="/masuk" aria-label="Masuk" className="p-2 text-gray-600 hover:text-primary">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Menu akun"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-gray-200"
      >
        <Image src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E53935&color=fff&size=40`} alt={user.name} width={32} height={32} className="h-full w-full object-cover" unoptimized />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
          <div className="fixed right-4 top-14 z-[61] w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg sm:right-8 lg:right-24">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
            </div>
            <Link href="/tulis" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
              Tulis Artikel
            </Link>
            <Link href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
              Profil Saya
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('beritana_token')
                localStorage.removeItem('beritana_user')
                setUser(null)
                setDropdownOpen(false)
                window.location.href = '/'
              }}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
