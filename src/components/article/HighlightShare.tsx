'use client'

import { useState, useEffect } from 'react'

export function HighlightShare() {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim() || ''

      if (text.length > 5) {
        const range = selection?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()
        if (rect) {
          setPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 + window.scrollY })
          setSelectedText(text)
          setShow(true)
        }
      } else {
        setShow(false)
      }
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [])

  if (!show) return null

  const encoded = encodeURIComponent(selectedText.slice(0, 200))
  const url = encodeURIComponent(window.location.href)

  return (
    <div
      className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-gray-900 px-2 py-1.5 shadow-xl"
      style={{ left: position.x, top: position.y - 45 }}
    >
      <a
        href={`https://twitter.com/intent/tweet?text=${encoded}&url=${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1.5 text-white hover:bg-gray-700"
        aria-label="Share ke Twitter"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a
        href={`https://wa.me/?text=${encoded}%20${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1.5 text-white hover:bg-gray-700"
        aria-label="Share ke WhatsApp"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
      </a>
      <button
        onClick={() => { navigator.clipboard.writeText(selectedText); setShow(false) }}
        className="rounded p-1.5 text-white hover:bg-gray-700"
        aria-label="Copy teks"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  )
}
