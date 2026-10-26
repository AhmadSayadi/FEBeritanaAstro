'use client'

import { useState, useEffect } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector('article')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const articleTop = rect.top + window.scrollY
      const articleHeight = article.offsetHeight
      const scrolled = window.scrollY - articleTop + window.innerHeight * 0.3
      const percent = Math.min(Math.max((scrolled / articleHeight) * 100, 0), 100)
      setProgress(percent)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (progress <= 0) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-[9998] h-[3px]">
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
