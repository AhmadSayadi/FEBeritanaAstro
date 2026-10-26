'use client'

import { useState, useEffect } from 'react'
import dynamic from '@/compat/dynamic'
import Link from '@/compat/Link'
import { useRouter, useSearchParams } from '@/compat/navigation'
import { getCurrentUser, isLoggedIn, isAuthor, getToken } from '@/lib/auth'
import { getImageUrl } from '@/lib/api'
import { TagAutocomplete } from '@/components/ui/TagAutocomplete'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), {
  ssr: false,
  loading: () => <div className="h-[450px] rounded-lg border border-gray-200 bg-white" />,
})

export function WriteArticlePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [descriptionEdited, setDescriptionEdited] = useState(false)
  const [category, setCategory] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailCredit, setThumbnailCredit] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [status, setStatus] = useState<'draft' | 'pending'>('draft')
  void status // used in auto-save display
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; id: number }[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  // AI assist
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMode, setAiMode] = useState<'generate' | 'rewrite'>('generate')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Word/char count
  const plainText = content.replace(/<[^>]*>/g, '')
  const charCount = plainText.length
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0
  const titleCharCount = title.length

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/masuk')
      return
    }
    setAuthorized(isAuthor())

    // Fetch categories from API
    fetch('/api/categories-list')
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setCategoryOptions(data.data.map((c: { id: number; name: string; slug: string }) => ({
            label: c.name,
            value: c.slug,
            id: c.id,
          })))
        }
      })
      .catch(() => {})

    // Fetch popular tags
    fetch('/api/tags-list?sort=popular&limit=15')
      .then(res => res.json())
      .then(data => {
        const tags = data?.data || []
        setPopularTags(tags.map((t: { name: string }) => t.name))
      })
      .catch(() => {})
  }, [router])

  // Load article for editing if ?edit=ID
  useEffect(() => {
    const id = searchParams.get('edit')
    if (!id) return
    const articleId = parseInt(id, 10)
    if (isNaN(articleId)) return

    setEditId(articleId)
    setLoadingEdit(true)

    const token = getToken()
    if (!token) { setLoadingEdit(false); return }

    fetch(`/api/author/articles/${articleId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const article = data?.data || data
        if (!article) return

        setTitle(article.title || '')
        setContent(article.content || '')
        setSlug(article.slug || '')
        setSlugEdited(true)
        setDescription(article.excerpt || article.description || '')
        if (article.excerpt || article.description) setDescriptionEdited(true)

        // Set status from article
        if (article.status === 'pending' || article.status === 'draft') {
          setStatus(article.status)
        }

        // Set categories
        if (article.category_ids && Array.isArray(article.category_ids)) {
          // If we have IDs, resolve to slugs from categoryOptions later
        } else if (article.categories && Array.isArray(article.categories)) {
          setCategory(article.categories.map((c: { slug: string }) => c.slug))
        } else if (article.category?.slug) {
          setCategory([article.category.slug])
        }

        // Set tags — handle various API response formats
        const rawTags = article.tags || article.tag_names || []
        if (Array.isArray(rawTags) && rawTags.length > 0) {
          const parsedTags = rawTags.map((t: string | { name?: string; slug?: string; id?: number }) => {
            if (typeof t === 'string') return t
            return t.name || t.slug || ''
          }).filter(Boolean)
          setTags(parsedTags)
        }

        // Set thumbnail preview (existing URL)
        if (article.thumbnail_url) {
          setThumbnailPreview(article.thumbnail_url)
        }
        if (article.thumbnail_credit) {
          setThumbnailCredit(article.thumbnail_credit)
        }

        if (article.scheduled_at) {
          setPublishDate(article.scheduled_at.slice(0, 16))
        }

        // Show last saved time from article data
        const savedAt = article.updated_at || article.created_at
        if (savedAt) {
          setLastSaved(new Date(savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' — ' + new Date(savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false))
  }, [searchParams])

  // Auto-save draft every 30s
  useEffect(() => {
    if (!title && !content) return
    const timer = setInterval(() => {
      setLastSaved(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
      setStatus('draft')
    }, 30000)
    return () => clearInterval(timer)
  }, [title, content])

  // Auto-fill description from first paragraph of content (if not manually edited)
  useEffect(() => {
    if (descriptionEdited) return
    if (!content) return
    // Extract text from first <p> tag
    const match = content.match(/<p[^>]*>(.*?)<\/p>/i)
    if (match) {
      const text = match[1].replace(/<[^>]*>/g, '').trim()
      if (text) setDescription(text.slice(0, 200))
    }
  }, [content, descriptionEdited])

  const handleSubmit = async (submitStatus: 'draft' | 'pending') => {
    if (submitStatus === 'pending' && (!title.trim() || !content.trim())) return
    setSubmitting(true)

    const token = getToken()

    if (submitStatus === 'pending' && !thumbnail && !thumbnailPreview) {
      setErrorMsg('Thumbnail wajib diisi untuk submit review')
      setSubmitting(false)
      return
    }

    if (!token) {
      setSubmitting(false)
      setErrorMsg('Login dulu')
      return
    }

    try {
      // Upload thumbnail first if exists
      let thumbnailUrl = ''
      const thumbnailAlt = title || 'Thumbnail artikel'
      if (thumbnail) {
        const uploadForm = new FormData()
        uploadForm.append('image', thumbnail)
        uploadForm.append('type', 'thumbnail')

        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadForm,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          thumbnailUrl = uploadData?.data?.url || uploadData?.url || ''
        } else {
          setErrorMsg('Upload thumbnail gagal. Coba lagi.')
          setSubmitting(false)
          return
        }

        if (!thumbnailUrl) {
          setErrorMsg('Upload thumbnail gagal — URL tidak diterima.')
          setSubmitting(false)
          return
        }
      }

      // Resolve category slugs to IDs
      const categoryIds = category
        .map(slug => categoryOptions.find(c => c.value === slug)?.id)
        .filter((id): id is number => id !== undefined)

      // Build article payload as JSON
      // Auto-generate excerpt & description from first paragraph if not manually written
      const firstParagraph = content.match(/<p[^>]*>(.*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g, '').trim() || ''
      const autoText = description || firstParagraph
      const excerptValue = autoText.slice(0, 500)

      const payload: Record<string, unknown> = {
        title,
        excerpt: excerptValue,
        description: excerptValue.slice(0, 160),
        content,
        category_ids: categoryIds,
        tag_names: tags, // BE auto create-or-find by name
        status: submitStatus,
      }
      if (slug) payload.slug = slug
      if (publishDate) payload.scheduled_at = publishDate
      if (thumbnailUrl) {
        payload.thumbnail_url = thumbnailUrl
        payload.thumbnail_alt = thumbnailAlt
        if (thumbnailCredit) payload.thumbnail_credit = thumbnailCredit
      } else if (thumbnailPreview && editId) {
        payload.thumbnail_url = thumbnailPreview
        payload.thumbnail_alt = thumbnailAlt
        if (thumbnailCredit) payload.thumbnail_credit = thumbnailCredit
      }

      const res = await fetch(editId ? `/api/author/articles/${editId}` : '/api/author/articles', {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        if (submitStatus === 'pending') {
          setSubmitted(true)
        } else {
          setLastSaved(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
          setStatus('draft')
        }
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.message || 'Gagal menyimpan artikel')
      }
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server')
    } finally {
      setSubmitting(false)
    }
  }

  // AI assist — generate new article or rewrite existing content
  const handleAiAssist = async () => {
    setAiLoading(true)
    setAiError('')

    const token = getToken()
    if (!token) {
      setAiError('Login dulu')
      setAiLoading(false)
      return
    }

    // Validation per mode
    if (aiMode === 'generate' && !aiPrompt.trim()) {
      setAiError('Masukkan topik atau instruksi untuk AI')
      setAiLoading(false)
      return
    }
    if (aiMode === 'rewrite' && !content.trim()) {
      setAiError('Tidak ada konten untuk ditulis ulang')
      setAiLoading(false)
      return
    }

    try {
      const res = await fetch('/api/author/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: aiMode, // 'generate' | 'rewrite'
          prompt: aiPrompt,
          title: title || undefined,
          content: aiMode === 'rewrite' ? content : undefined,
          category: category[0] || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.data) {
        const result = data.data
        // Fill fields from AI response
        if (result.title && !title) setTitle(result.title)
        if (result.content) setContent(result.content)
        if (result.excerpt) { setDescription(result.excerpt); setDescriptionEdited(true) }
        if (result.tags && Array.isArray(result.tags)) {
          setTags(prev => Array.from(new Set([...prev, ...result.tags])))
        }
        setAiOpen(false)
        setAiPrompt('')
      } else {
        setAiError(data?.message || 'AI gagal memproses. Coba lagi.')
      }
    } catch {
      setAiError('Tidak dapat terhubung ke server AI')
    } finally {
      setAiLoading(false)
    }
  }

  if (authorized === null) {
    return (
      <div className="container-main flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    )
  }

  if (loadingEdit) {
    return (
      <div className="container-main flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="mt-3 text-sm text-gray-500">Memuat artikel...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    const user = getCurrentUser()
    return (
      <section className="container-main flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Akses Ditolak</h1>
        <p className="mt-2 text-gray-600">Halo {user?.name}, akun Anda belum memiliki akses penulis.</p>
        <Link href="/" className="btn-primary mt-6">Kembali ke Beranda</Link>
      </section>
    )
  }

  if (submitted) {
    return (
      <section className="container-main flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Artikel Terkirim!</h1>
        <p className="mt-2 text-gray-600">Artikel Anda sedang ditinjau oleh tim editorial.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => { setSubmitted(false); setTitle(''); setContent(''); setDescription(''); setTags([]) }} className="btn-primary">Tulis Lagi</button>
          <Link href="/" className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary">Kembali ke Beranda</Link>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top toolbar */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="container-main flex items-center justify-between py-2">
          <Link href="/" className="p-2 text-gray-500 hover:text-gray-900" aria-label="Kembali">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>

          <div className="flex items-center gap-2">
            {/* Error — mobile: icon only */}
            {errorMsg && (
              <span className="hidden text-xs text-red-500 sm:inline">{errorMsg}</span>
            )}

            {/* Saved status — hidden on mobile */}
            {lastSaved && (
              <span className="hidden text-xs text-gray-500 sm:inline">
                Saved as <span className="font-bold text-primary">{editId ? (status === 'pending' ? 'PENDING' : 'DRAFT') : 'DRAFT'}</span> — {lastSaved}
              </span>
            )}

            {/* Delete — hidden on mobile (accessible via sidebar) */}
            {editId && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Yakin ingin menghapus artikel ini?')) return
                  const token = getToken()
                  const res = await fetch(`/api/author/articles/${editId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                  })
                  const data = await res.json().catch(() => ({}))
                  if (res.ok) {
                    router.push('/profil')
                  } else {
                    setErrorMsg(data?.message || 'Gagal menghapus artikel')
                  }
                }}
                className="hidden rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 sm:inline-flex"
              >
                Hapus
              </button>
            )}

            {/* AI Assist — hidden on mobile */}
            <button
              type="button"
              disabled
              title="Fitur AI Assist segera hadir"
              className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed sm:flex"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              AI Assist
            </button>

            {/* Save Draft */}
            <button
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Draft</span>
            </button>

            {/* Submit */}
            <button
              onClick={() => handleSubmit('pending')}
              disabled={submitting || !title.trim() || !content.trim()}
              className="btn-primary px-4 py-1.5 text-xs disabled:opacity-50"
            >
              {submitting ? '...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Mobile: show error + saved status below toolbar if needed */}
        {(errorMsg || lastSaved) && (
          <div className="border-t border-gray-100 px-4 py-1.5 sm:hidden">
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            {lastSaved && !errorMsg && (
              <p className="text-xs text-gray-500">
                Saved as <span className="font-bold text-primary">{editId ? (status === 'pending' ? 'PENDING' : 'DRAFT') : 'DRAFT'}</span> — {lastSaved}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main layout: Editor left + Sidebar right */}
      <div className="container-main flex flex-col gap-6 py-6 lg:flex-row">
        {/* Editor area — left */}
        <div className="min-w-0 flex-1">
          {/* Title input */}
          <textarea
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugEdited) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 150))
              }
            }}
            placeholder="Tulis judul di sini"
            maxLength={150}
            rows={1}
            className="mb-1 w-full resize-none overflow-hidden border-none bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none lg:text-3xl"
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
          />
          {/* Description input */}
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDescriptionEdited(true) }}
            placeholder="Tulis deskripsi singkat..."
            maxLength={200}
            rows={1}
            className="mb-2 w-full resize-none overflow-hidden border-none bg-transparent text-base text-gray-600 placeholder:text-gray-300 focus:outline-none"
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
          />
          {/* URL slug — editable */}
          {(title || slug) && (
            <div className="mb-4 flex flex-wrap items-baseline gap-1 text-xs">
              <span className="shrink-0 text-gray-500">{(process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000').replace(/^https?:\/\//, '')}/{category[0] || 'kategori'}/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugEdited(true) }}
                className="min-w-0 flex-1 border-none bg-transparent text-xs text-gray-700 focus:outline-none focus:underline"
              />
            </div>
          )}
          {/* Editor */}
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        {/* Sidebar — right (desktop) / below editor (mobile) */}
        <aside className="w-full shrink-0 space-y-4 lg:w-72">
          <div className="rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-14">
            {/* Stats */}
            <div className="border-b border-gray-100 pb-3">
              <p className="text-xs text-gray-500">Title Characters: <span className="font-medium text-gray-900">{titleCharCount}/80</span></p>
              <p className="text-xs text-gray-500">Characters: <span className="font-medium text-gray-900">{charCount}</span></p>
              <p className="text-xs text-gray-500">Words: <span className="font-medium text-gray-900">{wordCount}</span></p>
            </div>

            {/* Thumbnail with preview */}
            <div className="border-b border-gray-100 pb-3">
              <p className="mb-2 text-xs font-bold uppercase text-gray-700">Thumbnail</p>
              {thumbnail ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(thumbnail)}
                    alt="Preview thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnail(null)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Hapus gambar"
                  >
                    —
                  </button>
                </div>
              ) : thumbnailPreview ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailPreview.startsWith('http') ? thumbnailPreview : getImageUrl(thumbnailPreview)}
                    alt="Thumbnail saat ini"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailPreview(null)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Hapus gambar"
                  >
                    —
                  </button>
                  <label className="absolute bottom-1 left-1 cursor-pointer rounded bg-black/60 px-2 py-1 text-[10px] text-white hover:bg-black/80">
                    Ganti
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
                  </label>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-6 hover:border-primary">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-xs text-gray-500">Upload thumbnail</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            {/* Kredit foto */}
            <div className="border-b border-gray-100 pb-3">
              <p className="mb-1.5 text-xs font-bold uppercase text-gray-700">Kredit Foto</p>
              <input
                type="text"
                placeholder="Cth: Foto: ANTARA/Nama Fotografer"
                value={thumbnailCredit}
                onChange={(e) => setThumbnailCredit(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-[10px] text-gray-400">Opsional — ditampilkan di bawah foto artikel</p>
            </div>

            {/* Category — multiple checkbox */}
            <div className="border-b border-gray-100 pb-3">
              <p className="mb-2 text-xs font-bold uppercase text-gray-700">Kategori <span className="text-primary">*</span></p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-gray-200 p-2">
                {categoryOptions.length === 0 ? (
                  <p className="text-xs text-gray-400">Memuat...</p>
                ) : (
                  categoryOptions.map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={category.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategory(prev => [...prev, opt.value])
                          } else {
                            setCategory(prev => prev.filter(c => c !== opt.value))
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))
                )}
              </div>
              {category.length > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">{category.length} dipilih</p>
              )}
            </div>

            {/* Tags — input with autocomplete + tambah + popular */}
            <div className="border-b border-gray-100 pb-3">
              <p className="mb-2 text-xs font-bold uppercase text-gray-700">Tags</p>
              {/* Selected tags */}
              {tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                        className="text-primary/60 hover:text-primary"
                      >—</button>
                    </span>
                  ))}
                </div>
              )}
              {/* Tag input with autocomplete */}
              <TagAutocomplete
                tags={tags}
                onAdd={(tag) => { if (!tags.includes(tag)) setTags(prev => [...prev, tag]) }}
              />
              <p className="mt-1 text-[11px] text-gray-400">Ketik untuk cari tag, atau tambah baru dengan Enter</p>
              {/* Popular tags */}
              {popularTags.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="mb-1 text-[11px] font-medium text-primary">Pilih dari tag populer:</p>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.filter(t => !tags.includes(t)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTags(prev => [...prev, tag])}
                        className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-primary/10 hover:text-primary"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Publish Date */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-700">Jadwal Publish</p>
              {!publishDate ? (
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    const date = now.toISOString().split('T')[0]
                    const time = now.toTimeString().slice(0, 5)
                    setPublishDate(`${date}T${time}`)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-left hover:border-primary"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Atur jadwal</p>
                    <p className="text-[11px] text-gray-400">Publish sekarang jika tidak diatur</p>
                  </div>
                </button>
              ) : (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-800">Dijadwalkan</span>
                    </div>
                    <button type="button" onClick={() => setPublishDate('')} className="text-xs text-primary hover:underline">Hapus</button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={publishDate.split('T')[0] || ''}
                      onChange={(e) => {
                        const time = publishDate.split('T')[1] || '08:00'
                        setPublishDate(`${e.target.value}T${time}`)
                      }}
                      className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <input
                      type="time"
                      value={publishDate.split('T')[1] || ''}
                      onChange={(e) => {
                        const date = publishDate.split('T')[0]
                        setPublishDate(`${date}T${e.target.value}`)
                      }}
                      className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">
                    {new Date(publishDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* AI Assist Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !aiLoading && setAiOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">AI Assist</h3>
            </div>

            {/* Mode toggle */}
            <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setAiMode('generate')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${aiMode === 'generate' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500'}`}
              >
                Generate Artikel
              </button>
              <button
                type="button"
                onClick={() => setAiMode('rewrite')}
                disabled={!content.trim()}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${aiMode === 'rewrite' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500'}`}
              >
                Tulis Ulang
              </button>
            </div>

            {/* Prompt input */}
            {aiMode === 'generate' ? (
              <div>
                <label htmlFor="ai-prompt" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Topik / Instruksi</label>
                <textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Buat artikel tentang dampak kebijakan ekonomi terbaru terhadap UMKM, gaya jurnalistik formal..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-gray-400">AI akan membuat draft. Wajib direview & disunting sebelum publish.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="ai-prompt-rw" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Instruksi penulisan ulang (opsional)</label>
                <textarea
                  id="ai-prompt-rw"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Perbaiki gaya bahasa agar lebih ringkas dan formal, perbaiki tata bahasa..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-gray-400">AI akan menulis ulang konten yang sudah ada di editor.</p>
              </div>
            )}

            {/* Warning */}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                Konten AI wajib diverifikasi fakta, ditambah sudut pandang/data orisinal, dan disunting manusia. Hindari publish mentah untuk menjaga kualitas & SEO.
              </p>
            </div>

            {aiError && <p className="mt-3 text-xs text-red-500">{aiError}</p>}

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                disabled={aiLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiLoading}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memproses...
                  </>
                ) : (
                  aiMode === 'generate' ? 'Generate' : 'Tulis Ulang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

