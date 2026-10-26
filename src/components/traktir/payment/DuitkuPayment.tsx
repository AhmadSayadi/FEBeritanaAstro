'use client'

import { StaticQrisPayment } from './StaticQrisPayment'
import type { PaymentProps } from './types'

/**
 * Stub provider Duitku (masa depan).
 *
 * Nanti komponen ini akan: membuat transaksi via apiAuthFetch (backend yang
 * menentukan nominal dari config — bukan nilai dari klien), menampilkan QRIS
 * dinamis, dan status transaksi (pending/sukses/gagal) sesuai Req 6.7.
 *
 * Untuk sementara mendelegasikan ke StaticQrisPayment agar alur tetap jalan.
 */
export function DuitkuPayment(props: PaymentProps) {
  return <StaticQrisPayment {...props} />
}
