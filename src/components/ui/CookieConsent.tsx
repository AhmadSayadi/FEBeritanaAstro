'use client'

import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Delay show to not block initial render
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg sm:p-5">
      <div className="container-main flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-sm text-gray-700 sm:text-left">
          Kami menggunakan cookie untuk meningkatkan pengalaman Anda.{' '}
          <a href="/pages/privacy-policy" className="text-primary-dark underline" target="_blank" rel="noopener noreferrer">Pelajari lebih lanjut</a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={accept}
            className="btn-primary text-xs"
          >
            Terima
          </button>
          <button
            onClick={() => setShow(false)}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400"
          >
            Tolak
          </button>
        </div>
      </div>
    </div>
  )
}
