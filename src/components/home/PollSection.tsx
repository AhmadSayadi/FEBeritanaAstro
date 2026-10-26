'use client'

import { useState, useEffect, useRef } from 'react'

interface PollOption {
  id: number
  text: string
  votes: number
  percentage?: number
}

interface Poll {
  id: number
  question: string
  options: PollOption[]
  total_votes: number
  user_voted: boolean
  expires_at?: string
  thumbnail_url?: string
  source?: string
}

export function PollSection({ initialPoll }: { initialPoll?: Poll }) {
  const [polls, setPolls] = useState<Poll[]>(initialPoll ? [initialPoll] : [])
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(!initialPoll)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialPoll) return
    fetch('/api/polls')
      .then(res => res.json())
      .then(data => {
        const items = data?.data || []
        if (items.length > 0) setPolls(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialPoll])

  const handleVote = async (pollId: number, optionId: number) => {
    if (votedPolls.has(pollId)) return
    setVotedPolls(prev => new Set([...prev, pollId]))

    try {
      await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId }),
      })
      const res = await fetch(`/api/polls/${pollId}/results`)
      const data = await res.json()
      if (data?.data) {
        setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...data.data } : p))
      }
    } catch {
      setVotedPolls(prev => { const s = new Set(prev); s.delete(pollId); return s })
    }
  }

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  if (loading) return null
  if (!polls.length) return null

  return (
    <section className="container-main py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-6 w-1 bg-primary" aria-hidden="true" />
          Polling
        </h2>
        {polls.length > 1 && (
          <div className="flex gap-2">
            <button onClick={() => scroll('left')} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-primary hover:text-primary dark:border-gray-700" aria-label="Sebelumnya">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => scroll('right')} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-primary hover:text-primary dark:border-gray-700" aria-label="Selanjutnya">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {polls.map((poll) => {
          const hasVoted = votedPolls.has(poll.id) || poll.user_voted
          const totalVotes = poll.total_votes || poll.options.reduce((sum, o) => sum + o.votes, 0)

          return (
            <div
              key={poll.id}
              className="w-[320px] shrink-0 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
            >
              {/* Question */}
              <p className="text-[15px] font-bold leading-snug text-gray-900 dark:text-white">
                {poll.question}
              </p>

              {/* Options */}
              <div className="mt-4 space-y-2.5">
                {poll.options.map((opt) => {
                  const pct = opt.percentage || (totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0)

                  if (hasVoted) {
                    return (
                      <div key={opt.id} className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg bg-primary/10"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.text}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{pct}%</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(poll.id, opt.id)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary"
                    >
                      {opt.text}
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <span className="text-primary font-medium">{totalVotes.toLocaleString()} Pemilih</span>
                {poll.expires_at && (
                  <>
                    <span>·</span>
                    <span>{formatExpiry(poll.expires_at)}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function formatExpiry(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  if (date < now) return 'Berakhir'
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 1) return 'Hari ini'
  return `${diffDays} hari lagi`
}
