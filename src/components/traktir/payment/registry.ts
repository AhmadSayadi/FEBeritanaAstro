import type { ComponentType } from 'react'
import type { PaymentProvider } from '@/lib/types'
import type { PaymentProps } from './types'
import { StaticQrisPayment } from './StaticQrisPayment'
import { DuitkuPayment } from './DuitkuPayment'

/**
 * Registry Payment_Provider → komponen pembayaran.
 * Menambah provider baru cukup mendaftarkan satu entri di sini — alur pemilihan
 * nominal & autentikasi tidak berubah (Req 9.1, 9.2).
 */
const registry: Record<PaymentProvider, ComponentType<PaymentProps>> = {
  static_qris: StaticQrisPayment,
  duitku: DuitkuPayment,
}

/**
 * Pilih komponen pembayaran berdasarkan nilai provider.
 * Nilai yang tidak dikenal jatuh ke fallback aman (StaticQrisPayment).
 */
export function resolvePaymentComponent(provider: string): ComponentType<PaymentProps> {
  return registry[provider as PaymentProvider] ?? StaticQrisPayment
}
