'use client'

import Image from '@/compat/Image'
import { formatRupiah, TRAKTIR_MESSAGES } from '@/lib/traktir'
import type { PaymentProps } from './types'

/**
 * Pembayaran via gambar QRIS statis (fase saat ini).
 * Tidak ada deteksi status pembayaran otomatis (Req 6.1, 6.5).
 */
export function StaticQrisPayment({ context, config }: PaymentProps) {
  const hasQris = !!config.qris_image_url && config.qris_image_url.trim() !== ''

  return (
    <div className="flex flex-col items-center text-center">
      {/* Judul */}
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">Traktir Kopi</h1>

      {/* Penerima + artikel */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Traktir{' '}
        <span className="font-semibold text-gray-900 dark:text-white">{context.authorName}</span>
      </p>
      <p className="mt-1 line-clamp-2 max-w-xs text-xs text-gray-500 dark:text-gray-400">
        untuk artikel &ldquo;{context.articleTitle}&rdquo;
      </p>

      {/* Nominal */}
      <div className="mt-4 flex flex-col items-center gap-0.5">
        <span className="text-3xl font-bold text-red-700 dark:text-red-400">
          {formatRupiah(context.amount)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{context.cups} gelas kopi</span>
      </div>

      {/* QRIS */}
      {hasQris ? (
        <>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700">
            <Image
              src={config.qris_image_url as string}
              alt={`QRIS untuk traktir ${context.authorName}`}
              width={256}
              height={256}
              unoptimized
              className="mx-auto aspect-square w-56 max-w-full object-contain sm:w-64"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-300">
            Pindai kode QRIS di atas dengan aplikasi e-wallet atau mobile banking Anda untuk menyelesaikan pembayaran.
          </p>
        </>
      ) : (
        <p className="mt-6 w-full rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          {TRAKTIR_MESSAGES.qrisUnavailable}
        </p>
      )}
    </div>
  )
}
