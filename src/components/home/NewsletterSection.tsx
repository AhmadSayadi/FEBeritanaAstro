'use client'

import { useState } from 'react'

export function NewsletterSection({ data }: { data?: { title: string; description: string; bg_color?: string; bg_image?: string } }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok || data.success) {
        setStatus('success')
        setMessage('Berhasil berlangganan! Cek inbox Anda.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.message || 'Gagal berlangganan')
      }
    } catch {
      setStatus('error')
      setMessage('Tidak dapat terhubung ke server')
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 py-12">
      <div className="container-main relative z-10 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {data?.title || 'Jangan Lewatkan Berita Penting'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-300">
          {data?.description || 'Dapatkan berita terbaru langsung di inbox Anda setiap pagi. Gratis, tanpa spam.'}
        </p>

        {status === 'success' ? (
          <div className="mx-auto mt-6 max-w-md rounded-lg bg-green-500/20 px-4 py-3 text-sm text-green-300">
            ✓ {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="min-w-0 flex-1 rounded-lg bg-white/10 px-4 py-3 text-sm text-white placeholder-gray-400 backdrop-blur-sm focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-xs text-red-400">{message}</p>
        )}
      </div>
      {/* Decorative */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
    </section>
  )
}
