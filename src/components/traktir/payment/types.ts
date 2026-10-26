import type { DonationContext, TraktirConfig } from '@/lib/types'

/** Props bersama untuk setiap komponen pembayaran (per Payment_Provider). */
export interface PaymentProps {
  context: DonationContext
  config: TraktirConfig
}
