'use client'

import { useState } from 'react'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok || data.success) {
        setSuccess(true)
        setMessage(data.message || 'Link reset password telah dikirim ke email Anda.')
      } else {
        setMessage(data.message || 'Gagal mengirim link reset password.')
      }
    } catch {
      setMessage('Tidak dapat terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Cek Email Anda</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <Link href="/masuk" className="btn-primary mt-6 inline-block">
          Kembali ke Login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div>
        <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {message && (
        <p className="text-sm text-red-500">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? 'Mengirim...' : 'Kirim Link Reset'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Ingat password? <Link href="/masuk" className="font-medium text-primary hover:underline">Login</Link>
      </p>
    </form>
  )
}
