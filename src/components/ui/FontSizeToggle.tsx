'use client'

import { useState } from 'react'

export function FontSizeToggle() {
  const [size, setSize] = useState(16)

  const increase = () => {
    const next = Math.min(size + 2, 24)
    setSize(next)
    document.documentElement.style.setProperty('--article-font-size', `${next}px`)
  }

  const decrease = () => {
    const next = Math.max(size - 2, 12)
    setSize(next)
    document.documentElement.style.setProperty('--article-font-size', `${next}px`)
  }

  return (
    <div className="flex items-center gap-1 rounded border border-gray-200 px-1">
      <button
        onClick={decrease}
        aria-label="Perkecil teks"
        className="px-1.5 py-1 text-xs font-medium text-gray-600 hover:text-primary"
      >
        A-
      </button>
      <span className="h-4 w-px bg-gray-200" />
      <button
        onClick={increase}
        aria-label="Perbesar teks"
        className="px-1.5 py-1 text-sm font-medium text-gray-600 hover:text-primary"
      >
        A+
      </button>
    </div>
  )
}
