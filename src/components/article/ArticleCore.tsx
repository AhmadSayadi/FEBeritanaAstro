'use client'

/**
 * Interactive core of the article — the <article> column only: header,
 * tools row, body (with interleaved ad widgets), FAQ, credits, tags,
 * like/bookmark, share, author bio, comments, and the in-article ads.
 *
 * This is the one island that genuinely needs client JS. The page's static
 * parts (breadcrumb, related grid, sidebar, "Berita Lainnya") are rendered as
 * pure server HTML by the .astro page + ArticleTail.tsx (zero JS), so the JS
 * payload is far smaller than hydrating the whole page.
 *
 * Markup/classes identical to the original ArticlePageView <article> block.
 */
import Image from '@/compat/Image'
import Link from '@/compat/Link'
import { getImageUrl } from '@/lib/api'
import type { Article } from '@/lib/types'
import { ArticleHeader } from '@/components/article/ArticleHeader'
import { ArticleBody } from '@/components/article/ArticleBody'
import { ArticleCard } from '@/components/article/ArticleCard'
import { EmbedScripts } from '@/components/article/EmbedScripts'
import { ShareButtons } from '@/components/article/ShareButtons'
import { AdBanner } from '@/components/ads/AdBanner'
import { AdSenseUnit } from '@/components/ads/AdSenseUnit'
import { RelatedCategories } from '@/components/article/RelatedCategories'
import {
  ReadingProgress,
  LikeButton,
  BookmarkButton,
  CommentSection,
  SocialProof,
  FontSizeToggle,
  TextToSpeech,
  ReadingMode,
  HighlightShare,
} from '@/components/article/ArticleClientComponents'

interface Props {
  article: Article
  related: Article[]
  siteUrl: string
}

export function ArticleCore({ article, related, siteUrl }: Props) {
  return (
    <article className="min-w-0 flex-1">
      <ReadingProgress />
      <HighlightShare />

      <div className="max-w-3xl">
        <ArticleHeader article={article} />

        {/* Social proof + tools */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SocialProof slug={article.slug} initialViews={article.views || 0} />
          <div className="flex items-center gap-2">
            <TextToSpeech />
            <ReadingMode />
            <FontSizeToggle />
          </div>
        </div>

        {/* Article body — real content from backend + inline "Baca Juga" + Ad */}
        <ArticleBody
          content={article.content || ''}
          inlineWidgets={
            related && related.length > 0
              ? related.slice(0, 4).map((r, idx) => (
                  <div key={r.id} className="space-y-6">
                    {idx === 0 && <AdBanner posisi="artikel_tengah" category={article.category?.slug || ''} />}
                    <div className="border-l-4 border-gray-800 py-3 pl-4 dark:border-gray-300">
                      <Link href={`/${r.category?.slug || 'nasional'}/${r.slug}`} className="group">
                        <span className="text-sm font-bold text-primary">Baca Juga - </span>
                        <span className="text-sm font-semibold text-primary underline decoration-primary/30 group-hover:decoration-primary">
                          {r.title}
                        </span>
                      </Link>
                    </div>
                  </div>
                ))
              : [
                  <div key="ad-only">
                    <AdBanner posisi="artikel_tengah" category={article.category?.slug || ''} />
                  </div>,
                ]
          }
        />

        <EmbedScripts content={article.content || ''} />

        {/* FAQ section */}
        {article.faqs && article.faqs.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Pertanyaan Umum</h2>
            <div className="space-y-3">
              {article.faqs.map((faq, i) => (
                <details key={i} className="group rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:hidden dark:text-white">
                    <span className="flex items-center justify-between">
                      {faq.question}
                      <svg className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* AI disclosure */}
        {article.is_ai_assisted && (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {article.ai_disclosure_text || `Artikel ini disusun dengan bantuan teknologi AI dan telah ditinjau serta disunting oleh tim redaksi${article.author ? ` ${article.author.name}` : ''}.`}
            </p>
          </div>
        )}

        {/* Editor credit */}
        {(article.author || article.editor) && (
          <div className="mt-8 border-t border-gray-300 pt-5 dark:border-gray-600">
            {article.author && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                Baca juga tulisan lainnya dari{' '}
                <Link href={`/profile/${article.author.slug}`} className="text-primary hover:underline">
                  {article.author.name}
                </Link>
              </p>
            )}
            <div className="space-y-0.5 text-sm text-gray-800 dark:text-white">
              {article.author && (
                <p>
                  <span className="font-bold">Penulis:</span>{' '}
                  <Link href={`/profile/${article.author.slug}`} className="font-normal hover:text-primary">
                    {article.author.name}
                  </Link>
                </p>
              )}
              {article.editor && (
                <p>
                  <span className="font-bold">Editor:</span>{' '}
                  {article.editor.slug ? (
                    <Link href={`/profile/${article.editor.slug}`} className="font-normal hover:text-primary">
                      {article.editor.name}
                    </Link>
                  ) : (
                    <span className="font-normal">{article.editor.name}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-400"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Like + Bookmark */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <LikeButton slug={article.slug} initialLikes={article.likes_count || 0} initialLiked={article.is_liked || false} />
          <BookmarkButton slug={article.slug} initialBookmarked={article.is_bookmarked || false} />
        </div>

        {/* Share */}
        <div className="mt-5">
          <ShareButtons url={`${siteUrl}/${article.category?.slug || 'berita'}/${article.slug}`} title={article.title} />
        </div>

        {/* Author bio */}
        {article.author && (
          <div className="mt-8 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
            <Link href={`/profile/${article.author.slug}`} className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={getImageUrl(article.author.avatar_url, { width: 112 })}
                  alt={`Foto ${article.author.name}`}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 dark:text-white">{article.author.name}</p>
                  {article.author.verified && (
                    <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Terverifikasi">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{article.author.bio || article.author.role}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Comments */}
        <CommentSection slug={article.slug} />
      </div>

      {/* In-article AdSense */}
      <div className="my-8">
        <AdSenseUnit slot="5000888654" format="fluid" layoutKey="-ih+e-o-3w+9h" />
      </div>

      {/* Ad: artikel_bawah */}
      <AdBanner posisi="artikel_bawah" category={article.category?.slug || ''} className="my-8" />

      {/* Postingan Terkait */}
      {related && related.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <span className="inline-block h-6 w-1 bg-primary" aria-hidden="true"></span>
            Postingan Terkait
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.filter((a) => a.category?.slug === article.category?.slug).slice(0, 6).map((a) => (
              <ArticleCard key={a.id} article={a} size="medium" />
            ))}
            {related.filter((a) => a.category?.slug === article.category?.slug).length === 0 &&
              related.slice(0, 3).map((a) => <ArticleCard key={a.id} article={a} size="medium" />)}
          </div>
        </div>
      )}

      {/* Kategori lain — internal linking */}
      <RelatedCategories excludeCategorySlug={article.category?.slug} />
    </article>
  )
}
