'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/auth'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Password tidak cocok')
      return
    }

    setLoading(true)
    const result = await register(name, email, password)

    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      setError(result.message || 'Registrasi gagal')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="reg-name" className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
        <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nama lengkap" />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="nama@email.com" />
      </div>
      <div>
        <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Minimal 8 karakter" />
      </div>
      <div>
        <label htmlFor="reg-confirm" className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password</label>
        <input id="reg-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Ulangi password" />
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" required className="mt-0.5 rounded border-gray-300" />
        <span>Saya setuju dengan <a href="/pages/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a></span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
        {loading ? 'Memproses...' : 'Daftar'}
      </button>
    </form>
  )
}
