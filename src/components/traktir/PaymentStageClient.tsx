'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@/compat/navigation'
import Link from '@/compat/Link'
import type { DonationContext, TraktirConfig } from '@/lib/types'
import { getTraktirConfig, buildReturnUrl, TRAKTIR_MESSAGES } from '@/lib/traktir'
import { isLoggedIn } from '@/lib/auth'
import { resolvePaymentComponent } from './payment/registry'

interface PaymentStageClientProps {
  /** Donation_Context hasil parse dari searchParams di server shell. Null bila tak valid. */
  context: DonationContext | null
}

type Status = 'loading' | 'ready' | 'error'

export function PaymentStageClient({ context }: PaymentStageClientProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [config, setConfig] = useState<TraktirConfig | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const router = useRouter()
  const redirected = useRef(false)

  // Belum login → arahkan ke /masuk dengan return URL yang membawa konteks (Req 9.5)
  useEffect(() => {
    if (!context) return
    if (!isLoggedIn() && !redirected.current) {
      redirected.current = true
      router.replace(`/masuk?redirect=${encodeURIComponent(buildReturnUrl(context))}`)
    }
  }, [context, router])

  // Muat config untuk Payment_Stage
  useEffect(() => {
    if (!context) return
    let active = true
    setStatus('loading')
    getTraktirConfig()
      .then((cfg) => {
        if (!active) return
        setConfig(cfg)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [context, reloadKey])

  // Konteks tidak valid → penerima tidak tersedia (Req 5.3)
  if (!context) {
    return (
      <Panel>
        <Message text={TRAKTIR_MESSAGES.recipientUnavailable} />
        <HomeLink />
      </Panel>
    )
  }

  if (status === 'loading') {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat…</p>
        </div>
      </Panel>
    )
  }

  if (status === 'error') {
    return (
      <Panel>
        <Message text={TRAKTIR_MESSAGES.loadFailed} />
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Coba lagi
        </button>
      </Panel>
    )
  }

  // Fitur nonaktif saat sampai di Payment_Stage (Req 7.3)
  if (!config || !config.active) {
    return (
      <Panel>
        <Message text={TRAKTIR_MESSAGES.featureUnavailable} />
        <HomeLink />
      </Panel>
    )
  }

  const PaymentComponent = resolvePaymentComponent(config.payment_provider)

  return (
    <Panel>
      <PaymentComponent context={context} config={config} />
    </Panel>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-start justify-center bg-gradient-to-b from-blue-700 to-blue-900 px-4 py-10 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        {children}
      </div>
    </div>
  )
}

function Message({ text }: { text: string }) {
  return <p className="text-center text-sm text-gray-700 dark:text-gray-200">{text}</p>
}

function HomeLink() {
  return (
    <div className="mt-4 text-center">
      <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
        Kembali ke beranda
      </Link>
    </div>
  )
}
