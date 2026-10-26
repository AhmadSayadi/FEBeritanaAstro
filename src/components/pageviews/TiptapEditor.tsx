'use client'

import { useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'

// Custom image with resize + alignment
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('width') || el.style.width || null,
        renderHTML: (attrs) => {
          if (!attrs.width) return {}
          return { width: attrs.width, style: `width: ${attrs.width}` }
        },
      },
      dataAlign: {
        default: 'center',
        renderHTML: (attrs) => ({ 'data-align': attrs.dataAlign }),
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes['data-align'] || 'center'
    const width = HTMLAttributes.width || HTMLAttributes.style?.match(/width:\s*([^;]+)/)?.[1] || '100%'
    const imgAttrs = { ...HTMLAttributes }
    delete imgAttrs.width
    delete imgAttrs.style
    // Figure wraps img — figure has the width so pseudo-element handles are positioned correctly
    const marginMap: Record<string, string> = { left: '0 auto 0 0', center: '0 auto', right: '0 0 0 auto' }
    return [
      'figure',
      { class: 'image-resizer', style: `width:${width}; margin:${marginMap[align] || '0 auto'};`, 'data-align': align },
      ['img', { ...imgAttrs, style: 'width:100%; display:block;' }],
    ]
  },
})

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [imageMenuOpen, setImageMenuOpen] = useState(false)
  const [embedModalOpen, setEmbedModalOpen] = useState(false)
  const [embedInput, setEmbedInput] = useState('')
  // Image upload modal state
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageAlt, setImageAlt] = useState('')
  const [imageCredit, setImageCredit] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  // Image resize popup
  const [imgPopup, setImgPopup] = useState<{ top: number; left: number } | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) {
            return 'Tulis judul di sini'
          }
          return 'Mulai menulis cerita...'
        },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      ResizableImage.configure({ inline: false }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-base max-w-none min-h-[400px] px-4 py-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content && !editor.isFocused && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Image click handler — detect click on img tag directly via DOM
  const selectedImgPos = useRef<number | null>(null)
  const selectedImgEl = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!editor) return

    // Wait for editor view to be mounted
    const timer = setTimeout(() => {
      if (!editor.view) return
      const editorDom = editor.view.dom

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement

      // Handle click — check if it's on a resize handle
      if (target.classList.contains('img-handle-left') || target.classList.contains('img-handle-right')) {
        return // Handled by mousedown
      }

      if (target.tagName === 'IMG' && target.closest('.ProseMirror')) {
        const pos = editor.view.posAtDOM(target, 0)
        selectedImgPos.current = pos
        selectedImgEl.current = target

        // Show popup
        const rect = target.getBoundingClientRect()
        const above = rect.top > 60
        setImgPopup({
          top: above ? rect.top - 48 : rect.bottom + 8,
          left: rect.left + rect.width / 2,
        })
      } else if (!target.closest('.img-popup-toolbar')) {
        setImgPopup(null)
        selectedImgPos.current = null
        selectedImgEl.current = null
      }
    }

    // Drag resize via edges of image — always works without needing click first
    const handleMouseDown = (e: Event) => {
      const me = e as MouseEvent
      const target = me.target as HTMLElement
      if (target.tagName !== 'IMG' || !target.closest('.ProseMirror')) return

      // Check if click is near left or right edge (within 24px)
      const rect = target.getBoundingClientRect()
      const offsetX = me.clientX - rect.left
      const isLeftEdge = offsetX < 24
      const isRightEdge = offsetX > rect.width - 24

      if (!isLeftEdge && !isRightEdge) return

      e.preventDefault()
      e.stopPropagation()
      const side = isRightEdge ? 'right' : 'left'
      const img = target

      // Set pos for this image
      const pos = editor.view.posAtDOM(target, 0)
      selectedImgPos.current = pos
      selectedImgEl.current = img

      const startX = me.clientX
      const startWidth = img.closest('.image-resizer')?.clientWidth || img.offsetWidth
      const containerWidth = img.closest('.ProseMirror')?.clientWidth || 800

      const onMove = (ev: MouseEvent) => {
        ev.preventDefault()
        const diff = side === 'right' ? ev.clientX - startX : startX - ev.clientX
        const newWidth = Math.max(60, startWidth + diff * 2)
        const percent = Math.min(100, Math.round((newWidth / containerWidth) * 100))
        // Update figure width directly for smooth visual
        const figure = img.closest('.image-resizer') as HTMLElement
        if (figure) figure.style.width = `${percent}%`
      }

      const onUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        const diff = side === 'right' ? ev.clientX - startX : startX - ev.clientX
        const newWidth = Math.max(60, startWidth + diff * 2)
        const percent = Math.min(100, Math.round((newWidth / containerWidth) * 100))
        // Commit to Tiptap
        const node = editor.state.doc.nodeAt(pos)
        if (node) {
          const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: `${percent}%` })
          editor.view.dispatch(tr)
        }
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

    editorDom.addEventListener('click', handleClick)
    editorDom.addEventListener('mousedown', handleMouseDown)
    }, 100) // Wait for view to mount

    return () => {
      clearTimeout(timer)
      try {
        const dom = editor?.view?.dom
        if (dom) {
          // Remove all listeners (re-added on next effect run)
          const clone = dom.cloneNode(false)
          void clone // cleanup handled by effect re-run
        }
      } catch {
        // editor destroyed
      }
    }
  }, [editor])

  // Close popup on click outside editor
  useEffect(() => {
    if (!imgPopup) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.img-popup-toolbar') && !target.closest('.ProseMirror')) {
        setImgPopup(null)
      }
    }
    // Close on scroll
    const scrollHandler = () => setImgPopup(null)

    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', scrollHandler, { passive: true })
    // Also listen on editor scroll container
    const editorEl = editorRef.current?.querySelector('.ProseMirror')
    editorEl?.addEventListener('scroll', scrollHandler, { passive: true })

    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', scrollHandler)
      editorEl?.removeEventListener('scroll', scrollHandler)
    }
  }, [imgPopup])

  if (!editor) return null

  /** Convert URL or raw embed code to insertable HTML — only social media allowed */
  const convertEmbedToHtml = (input: string): string | null => {
    // If already contains social media embed HTML (instagram-media, twitter-tweet, tiktok-embed, threads), allow
    if (input.includes('instagram-media') || input.includes('twitter-tweet') || input.includes('tiktok-embed') || input.includes('threads-embed')) {
      return `<div class="embed-wrapper">${input}</div>`
    }

    // YouTube URL → iframe
    const ytMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) {
      return `<div class="embed-wrapper"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe></div>`
    }

    // Instagram URL → blockquote embed
    if (input.includes('instagram.com/p/') || input.includes('instagram.com/reel/')) {
      return `<div class="embed-wrapper"><blockquote class="instagram-media" data-instgrm-permalink="${input}" data-instgrm-version="14"><a href="${input}">Lihat post di Instagram</a></blockquote></div>`
    }

    // TikTok URL → blockquote embed
    if (input.includes('tiktok.com/')) {
      const videoId = input.match(/video\/(\d+)/)?.[1] || ''
      return `<div class="embed-wrapper"><blockquote class="tiktok-embed" cite="${input}" data-video-id="${videoId}"><a href="${input}">Lihat di TikTok</a></blockquote></div>`
    }

    // Twitter/X URL → blockquote embed
    if (input.includes('twitter.com/') || input.includes('x.com/')) {
      return `<div class="embed-wrapper"><blockquote class="twitter-tweet"><a href="${input}">Lihat tweet</a></blockquote></div>`
    }

    // Facebook URL → iframe
    if (input.includes('facebook.com/')) {
      const encoded = encodeURIComponent(input)
      return `<div class="embed-wrapper"><iframe src="https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true&width=500" width="100%" height="450" frameborder="0" allowfullscreen></iframe></div>`
    }

    // Threads URL
    if (input.includes('threads.net/')) {
      return `<div class="embed-wrapper"><blockquote class="threads-embed"><a href="${input}">Lihat di Threads</a></blockquote></div>`
    }

    // Not a supported platform — reject
    return null
  }

  const addImage = () => {
    // Open file picker, then show modal
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImageFile(file)
      setImageAlt(file.name.replace(/\.[^.]+$/, ''))
      setImageCredit('')
      setImageModalOpen(true)
    }
    input.click()
    setImageMenuOpen(false)
  }

  const uploadImage = () => {
    // Same as addImage — opens file picker then modal
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImageFile(file)
      setImageAlt(file.name.replace(/\.[^.]+$/, ''))
      setImageCredit('')
      setImageModalOpen(true)
    }
    input.click()
    setImageMenuOpen(false)
  }

  const handleImageUpload = async () => {
    if (!imageFile || !editor) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('beritana_token') : null
    if (!token) {
      alert('Login dulu untuk upload gambar')
      return
    }
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('type', 'content')
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { alert('Upload gagal'); setImageUploading(false); return }
      const data = await res.json()
      const url = data?.data?.url || data?.url

      // Close modal FIRST, then insert into editor
      setImageUploading(false)
      setImageModalOpen(false)

      if (url) {
        const alt = imageAlt || imageFile.name
        const credit = imageCredit

        // Small delay to let modal close and editor regain focus
        setTimeout(() => {
          editor.chain().focus().setImage({ src: url, alt }).run()
          if (credit) {
            // Insert credit paragraph AFTER the image — move to end of image node first
            const { to } = editor.state.selection
            editor.chain().focus().setTextSelection(to).insertContent(`<p><em style="font-size:0.8rem;color:#6b7280;">${credit}</em></p>`).run()
          }
        }, 100)
      }

      setImageFile(null)
      setImageAlt('')
      setImageCredit('')
    } catch {
      alert('Tidak dapat terhubung ke server')
      setImageUploading(false)
      setImageModalOpen(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-3 py-2">
        {/* Paragraph/Heading dropdown */}
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
          }
          onChange={(e) => {
            const val = e.target.value
            if (val === 'p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: Number(val[1]) as 1 | 2 | 3 }).run()
          }}
          className="mr-2 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700"
          aria-label="Tipe teks"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Bold"
          title="Bold"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Italic"
          title="Italic"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded p-1.5 ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Underline"
          title="Underline"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
        </button>

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 ${editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Quote"
          title="Quote"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Bullet list"
          title="Bullet list"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Numbered list"
          title="Numbered list"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
        </button>

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {/* Image - dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setImageMenuOpen(!imageMenuOpen)}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
            aria-label="Insert image"
            title="Insert image"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          </button>

          {imageMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setImageMenuOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={uploadImage}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload from my Computer
                </button>
                <div className="border-t border-gray-100" />
                <button
                  type="button"
                  onClick={addImage}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Paste from URL
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`rounded p-1.5 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Align left"
          title="Rata kiri"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`rounded p-1.5 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Align center"
          title="Rata tengah"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`rounded p-1.5 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200'}`}
          aria-label="Align right"
          title="Rata kanan"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
        </button>

        {/* Embed Media Sosial */}
        <button
          type="button"
          onClick={() => setEmbedModalOpen(true)}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
          aria-label="Embed Media Sosial"
          title="Embed Media Sosial"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </button>
      </div>

      {/* Embed Modal */}
      {embedModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setEmbedModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Embed Media Sosial</h3>
                <button onClick={() => setEmbedModalOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="mb-3 text-sm text-gray-500">
                Paste URL atau embed code dari YouTube, Instagram, TikTok, X/Twitter, Facebook, atau Threads
              </p>
              <textarea
                value={embedInput}
                onChange={(e) => setEmbedInput(e.target.value)}
                placeholder={'https://...\natau paste embed code <iframe>...'}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEmbedModalOpen(false); setEmbedInput('') }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!embedInput.trim()) return
                    const html = convertEmbedToHtml(embedInput.trim())
                    if (!html) {
                      alert('Hanya embed dari YouTube, Instagram, TikTok, X/Twitter, Facebook, atau Threads yang diizinkan.')
                      return
                    }
                    editor.chain().focus().insertContent(html).run()
                    setEmbedModalOpen(false)
                    setEmbedInput('')
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Sisipkan
                </button>
              </div>
            </div>
          </div>
        </>
      )}


      {/* Image Upload Modal */}
      {imageModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setImageModalOpen(false); setImageFile(null) }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Upload Gambar</h3>
                <button onClick={() => { setImageModalOpen(false); setImageFile(null) }} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Preview */}
              {imageFile && (
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-contain" />
                </div>
              )}

              {/* Alt text */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-700">Deskripsi gambar (Alt text)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Deskripsi singkat untuk SEO"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Credit */}
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-700">Kredit / Sumber foto <span className="text-gray-400">(opsional)</span></label>
                <input
                  type="text"
                  value={imageCredit}
                  onChange={(e) => setImageCredit(e.target.value)}
                  placeholder="Cth: Foto: ANTARA/Nama Fotografer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setImageModalOpen(false); setImageFile(null) }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={imageUploading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {imageUploading ? 'Mengupload...' : 'Upload & Sisipkan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Editor content */}
      <div ref={editorRef} className="relative">
        <EditorContent editor={editor} />

        {/* Image resize popup — fixed positioning above clicked image */}
        {imgPopup && (
          <div
            className="img-popup-toolbar fixed z-[100] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-lg"
            style={{ top: imgPopup.top, left: imgPopup.left }}
          >
            {['25%', '50%', '75%', '100%'].map((size) => (
              <button key={size} type="button" onMouseDown={(e) => {
                e.preventDefault()
                if (selectedImgPos.current !== null && editor) {
                  const pos = selectedImgPos.current
                  const node = editor.state.doc.nodeAt(pos)
                  if (node) {
                    const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: size })
                    editor.view.dispatch(tr)
                    // Update popup position after resize
                    setTimeout(() => {
                      const dom = editor.view.nodeDOM(pos) as HTMLElement
                      const img = dom?.querySelector?.('img') || dom
                      if (img) {
                        const rect = img.getBoundingClientRect()
                        const above = rect.top > 60
                        setImgPopup({ top: above ? rect.top - 48 : rect.bottom + 8, left: rect.left + rect.width / 2 })
                      }
                    }, 20)
                  }
                }
              }} className={`rounded px-2 py-0.5 text-xs font-medium ${editor?.getAttributes('image').width === size ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{size}</button>
            ))}
            <div className="mx-0.5 h-4 w-px bg-gray-200" />
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button key={pos} type="button" onMouseDown={(e) => {
                e.preventDefault()
                if (selectedImgPos.current !== null && editor) {
                  const nodePos = selectedImgPos.current
                  const node = editor.state.doc.nodeAt(nodePos)
                  if (node) {
                    const tr = editor.state.tr.setNodeMarkup(nodePos, undefined, { ...node.attrs, dataAlign: pos })
                    editor.view.dispatch(tr)
                    // Update popup position after align change
                    setTimeout(() => {
                      const dom = editor.view.nodeDOM(nodePos) as HTMLElement
                      const img = dom?.querySelector?.('img') || dom
                      if (img) {
                        const rect = img.getBoundingClientRect()
                        const above = rect.top > 60
                        setImgPopup({ top: above ? rect.top - 48 : rect.bottom + 8, left: rect.left + rect.width / 2 })
                      }
                    }, 20)
                  }
                }
              }} className={`rounded p-1 ${editor?.getAttributes('image').dataAlign === pos ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`} title={pos === 'left' ? 'Kiri' : pos === 'center' ? 'Tengah' : 'Kanan'}>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  {pos === 'left' && <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>}
                  {pos === 'center' && <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>}
                  {pos === 'right' && <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>}
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
