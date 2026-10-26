'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface DatePickerProps {
  /** Selected value in YYYY-MM-DD format (empty string = none) */
  value: string
  /** Called with new value in YYYY-MM-DD format, or '' when cleared */
  onChange: (value: string) => void
  /** Max selectable date in YYYY-MM-DD (e.g. today) */
  max?: string
  /** Min selectable date in YYYY-MM-DD */
  min?: string
  placeholder?: string
  className?: string
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function parseDate(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplay(d: Date): string {
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function DatePicker({ value, onChange, max, min, placeholder = 'Pilih tanggal', className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => parseDate(value), [value])
  const maxDate = useMemo(() => parseDate(max || ''), [max])
  const minDate = useMemo(() => parseDate(min || ''), [min])

  // The month currently being viewed in the calendar
  const [viewDate, setViewDate] = useState<Date>(() => selected || new Date())

  // Keep the view in sync when value changes externally
  useEffect(() => {
    if (selected) setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [selected])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const startWeekday = firstDay.getDay() // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [year, month])

  function isDisabled(d: Date): boolean {
    if (maxDate && d > maxDate) return true
    if (minDate && d < minDate) return true
    return false
  }

  function selectDate(d: Date) {
    if (isDisabled(d)) return
    onChange(toISODate(d))
    setOpen(false)
  }

  const today = new Date()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={selected ? '' : 'text-gray-400'}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Hapus tanggal"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onChange('') } }}
            className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </span>
        )}
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Month nav */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              aria-label="Bulan sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {MONTHS_ID[month]} {year}
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              aria-label="Bulan berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {DAYS_ID.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-medium text-gray-400">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((d, i) => {
              if (!d) return <div key={`e-${i}`} />
              const disabled = isDisabled(d)
              const isSelected = selected && isSameDay(d, selected)
              const isToday = isSameDay(d, today)
              return (
                <button
                  key={toISODate(d)}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(d)}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                    isSelected
                      ? 'bg-primary font-semibold text-white'
                      : disabled
                        ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                        : 'text-gray-700 hover:bg-primary/10 hover:text-primary dark:text-gray-200',
                    !isSelected && isToday ? 'ring-1 ring-primary/40' : '',
                  ].join(' ')}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="text-xs text-gray-500 hover:text-primary"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => { if (!isDisabled(today)) { onChange(toISODate(today)); setOpen(false) } }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Hari ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
