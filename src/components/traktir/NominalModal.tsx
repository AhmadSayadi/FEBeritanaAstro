'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { CoffeeOption } from '@/lib/types'
import { formatRupiah, TRAKTIR_MESSAGES } from '@/lib/traktir'

interface NominalModalProps {
  open: boolean
  options: CoffeeOption[]
  onSelect: (option: CoffeeOption) => void
  onClose: () => void
  /** Elemen pemicu — fokus dikembalikan ke sini saat modal ditutup. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

/** Ikon gelas kopi sederhana. */
function CoffeeCup({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
      <path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M7 3c0 1-1 1-1 2M11 3c0 1-1 1-1 2M15 3c0 1-1 1-1 2" />
    </svg>
  )
}

const TITLE_ID = 'traktir-nominal-title'

export function NominalModal({ open, options, onSelect, onClose, triggerRef }: NominalModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // Escape untuk tutup + focus trap (Req 3.4, 3.5)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  // Arahkan fokus ke dalam modal saat terbuka; kunci scroll body (Req 3.5)
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFocusRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Kembalikan fokus ke pemicu saat modal ditutup (Req 3.7)
  const prevOpen = useRef(open)
  useEffect(() => {
    if (prevOpen.current && !open) {
      triggerRef.current?.focus()
    }
    prevOpen.current = open
  }, [open, triggerRef])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop (Req 3.4: klik latar menutup) */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 id={TITLE_ID} className="text-base font-semibold text-gray-900 dark:text-white">
            Pilih Nominal
          </h2>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {options.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {TRAKTIR_MESSAGES.emptyOptions}
            </p>
          ) : (
            <ul className="space-y-3">
              {options.map((option) => (
                <li key={`${option.cups}-${option.amount}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(option)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"
                  >
                    <span className="flex items-center gap-1 text-primary" aria-hidden="true">
                      {Array.from({ length: Math.min(option.cups, 5) }).map((_, i) => (
                        <CoffeeCup key={i} className="h-6 w-6" />
                      ))}
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {option.cups} gelas
                      </span>
                      <span className="text-base font-bold text-red-700 dark:text-red-400">
                        {formatRupiah(option.amount)}
                      </span>
                    </span>
                    <svg className="h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
