'use client'

import { useState, useEffect } from 'react'

export function TextToSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('speechSynthesis' in window)
  }, [])

  if (!supported) return null

  const toggle = () => {
    if (speaking) {
      speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const article = document.querySelector('article')
    if (!article) return

    // Get only the prose content (article body), starting from first paragraph
    const proseEl = article.querySelector<HTMLElement>('.prose')
    if (!proseEl) return

    const text = proseEl.innerText
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 0.9

    // Explicitly pick Indonesian voice if available
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices()
      const idVoice = voices.find(v =>
        v.lang === 'id-ID' || v.lang === 'id' || v.lang.startsWith('id-')
      )
      if (idVoice) utterance.voice = idVoice
      utterance.onend = () => setSpeaking(false)
      speechSynthesis.speak(utterance)
      setSpeaking(true)
    }

    // Voices may not be loaded yet on first call
    if (speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak()
    } else {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null
        setVoiceAndSpeak()
      }
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={speaking ? 'Stop membaca' : 'Dengarkan artikel'}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        speaking
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
      }`}
    >
      {speaking ? (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
      )}
      {speaking ? 'Stop' : 'Dengarkan'}
    </button>
  )
}
