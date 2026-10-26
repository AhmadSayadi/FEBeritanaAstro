'use client'

/**
 * Presentational homepage — extracted verbatim from the old Next.js
 * `src/app/page.tsx` render logic (minus the head-level concerns: metadata,
 * PreloadImage, WebSite + ItemList JSON-LD, and the sr-only <h1>, which the
 * Astro route emits server-side).
 *
 * The dynamic section ordering/activation logic from backend settings is kept
 * exactly as-is, so the homepage renders identical sections in identical order.
 */
import { Article } from '@/lib/types'
import type { HomepageData } from '@/lib/data'
import type { SiteConfig } from '@/lib/site-config'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoryColumns } from '@/components/home/CategoryColumns'
import { VideoStorySection } from '@/components/home/VideoStorySection'
import { BannerExclusive } from '@/components/home/BannerExclusive'
import { EKoranSection } from '@/components/home/EKoranSection'
import { PhotoNewsSection } from '@/components/home/PhotoNewsSection'
import { ExploreNewsSection } from '@/components/home/ExploreNewsSection'
import { TrendingBar } from '@/components/home/TrendingBar'
import { NewsletterSection } from '@/components/home/NewsletterSection'
import { PollSection } from '@/components/home/PollSection'
import { SponsoredSection } from '@/components/home/SponsoredSection'
import { TopAuthorsSection } from '@/components/home/TopAuthorsSection'
import { InfografisSection } from '@/components/home/InfografisSection'
import { PersonalizedFeed } from '@/components/home/PersonalizedFeed'
import { SpecialSection } from '@/components/home/SpecialSection'
import { TrendingTodaySection } from '@/components/home/TrendingTodaySection'
import { RecommendedSection } from '@/components/home/RecommendedSection'

interface Props {
  homepageData: HomepageData
  config: SiteConfig
}

export function HomePageView({ homepageData, config }: Props) {
  const {
    slider,
    latest_news,
    category_columns,
    video_story,
    banner_exclusive,
    ekoran,
    ekoran_background_url,
    photo_news,
    explore,
    popular,
  } = homepageData

  // New sections from API (conditional — only present if enabled in admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hd = homepageData as any
  const trendingKeywords = hd.trending_keywords as { keyword: string; slug: string; count?: number }[] | undefined
  const homepagePoll = hd.poll as { id: number; question: string; options: { id: number; text: string; votes: number }[]; total_votes?: number; user_voted?: boolean; expires_at?: string } | undefined
  const newsletterData = hd.newsletter as { title: string; description: string; bg_color?: string; bg_image?: string } | undefined
  const sponsoredData = hd.sponsored as { id: number; title: string; thumbnail_url: string; sponsor_name: string; click_url: string }[] | undefined
  const topAuthorsData = hd.top_authors as { id: number; name: string; slug: string; avatar_url: string | null; verified?: boolean; articles_count?: number }[] | undefined
  const infografisData = hd.infografis as { id: number; title: string; slug: string; thumbnail_url: string }[] | undefined
  const specialSections = hd.special_sections as { id: string; title: string; slug: string; type: 'category' | 'tag'; template?: 'normal' | 'event'; bg_color: string; bg_image?: string | null; logo_image?: string | null; description?: string; cta_text?: string; cta_url?: string; limit: number; articles?: Article[] }[] | undefined

  // e-Koran items mapping
  const ekoranItems = (ekoran || []).slice(0, config.limit_ekoran).map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    cover_url: item.cover_url,
    views: item.views ? `${(item.views / 1000).toFixed(1)}k` : '0',
    pdf_url: item.pdf_url,
    page_count: item.page_count,
  }))

  // Sort sections by order from backend settings
  const sections = [...(config.homepage_sections || [])].sort((a, b) => a.order - b.order)

  // Jika section 'recommended' belum didaftarkan di homepage_sections oleh backend,
  // sisipkan otomatis di posisi wajar (setelah hero_slider) supaya tidak nyangkut
  // di paling bawah. Kalau backend sudah mendaftarkannya, urutan BE yang dipakai.
  if (!sections.some((s) => s.id === 'recommended')) {
    const heroIdx = sections.findIndex((s) => s.id === 'hero_slider')
    const recSection = { id: 'recommended', name: 'Rekomendasi', active: true, order: 0 }
    if (heroIdx >= 0) sections.splice(heroIdx + 1, 0, recSection)
    else sections.unshift(recSection)
  }

  // Map section ID to JSX component
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero_slider':
        return (
          <HeroSection
            key="hero_slider"
            featured={slider[0] || null}
            latestNews={latest_news.slice(0, config.limit_latest_news)}
            sliderArticles={slider.slice(0, config.limit_slider)}
          />
        )
      case 'category_columns':
        if (!category_columns || category_columns.length === 0) return null
        return (
          <div key="category_columns" className="container-main">
            <CategoryColumns columns={category_columns} />
          </div>
        )
      case 'video_story':
        if (!video_story || video_story.length === 0) return null
        return (
          <VideoStorySection key="video_story" articles={video_story.slice(0, config.limit_video_story)} />
        )
      case 'banner_exclusive':
        if (!banner_exclusive || banner_exclusive.length === 0) return null
        return (
          <BannerExclusive key="banner_exclusive" articles={banner_exclusive.slice(0, config.limit_exclusive)} />
        )
      case 'ekoran':
        if (ekoranItems.length === 0) return null
        return (
          <EKoranSection key="ekoran" items={ekoranItems} backgroundUrl={ekoran_background_url || undefined} />
        )
      case 'photo_news':
        if (!photo_news || photo_news.length === 0) return null
        return (
          <PhotoNewsSection key="photo_news" articles={photo_news.slice(0, config.limit_foto)} />
        )
      case 'explore_news':
        return (
          <ExploreNewsSection
            key="explore_news"
            articles={(explore || []).slice(0, config.limit_explore)}
            popularArticles={popular || []}
            perPage={config.limit_berita_terbaru}
          />
        )
      case 'trending_bar':
        if (!trendingKeywords || !trendingKeywords.length) return <TrendingBar key="trending_bar" />
        return <TrendingBar key="trending_bar" initialData={trendingKeywords} />
      case 'trending_today':
        return <TrendingTodaySection key="trending_today" initialData={hd.trending_today} />
      case 'recommended': {
        // Prioritas: recommended (kurasi editor dari BE) → popular → explore
        const recommended = (hd.recommended as Article[] | undefined) || []
        const list = recommended.length ? recommended : (popular && popular.length ? popular : explore) || []
        if (!list.length) return null
        return <RecommendedSection key="recommended" articles={list} />
      }
      case 'newsletter':
        return <NewsletterSection key="newsletter" data={newsletterData} />
      case 'poll':
        if (!homepagePoll) return <PollSection key="poll" />
        return <PollSection key="poll" initialPoll={{ ...homepagePoll, total_votes: homepagePoll.total_votes || 0, user_voted: homepagePoll.user_voted || false }} />
      case 'sponsored':
        if (!sponsoredData || !sponsoredData.length) return <SponsoredSection key="sponsored" />
        return <SponsoredSection key="sponsored" initialData={sponsoredData} />
      case 'top_authors':
        if (!topAuthorsData || !topAuthorsData.length) return <TopAuthorsSection key="top_authors" />
        return <TopAuthorsSection key="top_authors" initialData={topAuthorsData} />
      case 'infografis':
        if (!infografisData || !infografisData.length) return <InfografisSection key="infografis" />
        return <InfografisSection key="infografis" initialData={infografisData} />
      case 'personalized_feed':
        return <PersonalizedFeed key="personalized_feed" />
      case 'special_section':
        if (!specialSections || !specialSections.length) return null
        return (
          <div key="special_sections">
            {specialSections.map((ss) => (
              <SpecialSection
                key={ss.id}
                title={ss.title}
                slug={ss.slug}
                type={ss.type || 'category'}
                template={ss.template || 'normal'}
                bgColor={ss.bg_color || '#1B5E20'}
                bgImage={ss.bg_image || undefined}
                logoImage={ss.logo_image || undefined}
                description={ss.description}
                ctaText={ss.cta_text}
                ctaUrl={ss.cta_url}
                limit={ss.limit || 4}
                initialArticles={ss.articles}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Render sections dynamically based on order + active from backend settings.
          Kontrol penuh ada di homepage_sections: section hanya tampil bila terdaftar
          dan active !== false. Menonaktifkan (active:false atau hapus entri) → hilang. */}
      {sections
        .filter(s => s.active)
        .map(s => renderSection(s.id))
      }
    </>
  )
}
