'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@/compat/navigation'
import type { Article, CoffeeOption, TraktirConfig, DonationContext } from '@/lib/types'
import { getTraktirConfig, buildReturnUrl } from '@/lib/traktir'
import { isLoggedIn } from '@/lib/auth'
import { NominalModal } from './NominalModal'

interface TraktirButtonProps {
  article: Pick<Article, 'slug' | 'title' | 'author'>
}

export function TraktirButton({ article }: TraktirButtonProps) {
  const [config, setConfig] = useState<TraktirConfig | null>(null)
  const [ready, setReady] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  // Muat config saat mount (status login & config hanya diketahui di client).
  useEffect(() => {
    let active = true
    getTraktirConfig()
      .then((cfg) => {
        if (active) setConfig(cfg)
      })
      .catch(() => {
        if (active) setConfig(null)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSelect = (option: CoffeeOption) => {
    setModalOpen(false)
    if (!article.author) return // penerima tidak tersedia (Req 5.3)

    const ctx: DonationContext = {
      articleSlug: article.slug,
      articleTitle: article.title,
      authorSlug: article.author.slug,
      authorName: article.author.name,
      cups: option.cups,
      amount: option.amount,
    }
    const returnUrl = buildReturnUrl(ctx)

    if (!isLoggedIn()) {
      router.push(`/masuk?redirect=${encodeURIComponent(returnUrl)}`)
      return
    }
    router.push(returnUrl)
  }

  // Sembunyikan saat: belum ready, config gagal/nonaktif, atau tanpa penulis
  // (Req 1.2, 1.3, 1.5, 1.6)
  if (!ready || !config || !config.active || !article.author) return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setModalOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold leading-none text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
          <path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2" />
        </svg>
        <span>Traktir Kopi</span>
      </button>

      <NominalModal
        open={modalOpen}
        options={config.coffee_options}
        onSelect={handleSelect}
        onClose={() => setModalOpen(false)}
        triggerRef={buttonRef}
      />
    </>
  )
}
