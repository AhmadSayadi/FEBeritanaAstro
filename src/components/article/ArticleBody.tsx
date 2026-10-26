import { ReactNode } from 'react'

interface ArticleBodyProps {
  content: string
  inlineWidget?: ReactNode
  inlineWidgets?: ReactNode[] // Multiple widgets (max 3) spread across article
}

// Note: `prose-p:text-gray-700` sets the body paragraph color, but it also
// OVERRIDES `dark:prose-invert` for <p>, so without an explicit dark value the
// paragraphs stay dark-gray and become unreadable in dark mode. The
// `dark:prose-p:text-gray-300` pairs it with a light color for dark mode.
const proseClasses = "prose prose-base max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-primary prose-img:rounded-lg prose-blockquote:border-primary dark:prose-invert"

export function ArticleBody({ content, inlineWidget, inlineWidgets }: ArticleBodyProps) {
  // If no widgets at all, render plain
  if (!inlineWidget && (!inlineWidgets || !inlineWidgets.length)) {
    return (
      <div
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // Split content by paragraphs
  const paragraphs = content.split(/<\/p>/i).filter(p => p.trim())
  const totalParagraphs = paragraphs.length

  // Determine how many widgets to inject (max 3, based on paragraph count)
  const widgets = inlineWidgets || (inlineWidget ? [inlineWidget] : [])
  let insertCount = 1
  if (totalParagraphs >= 17) insertCount = 4
  else if (totalParagraphs >= 11) insertCount = 3
  else if (totalParagraphs >= 6) insertCount = 2

  // Limit to available widgets
  insertCount = Math.min(insertCount, widgets.length)

  if (insertCount <= 1) {
    // Single widget — inject at midpoint (original behavior)
    const midPoint = Math.max(Math.floor(totalParagraphs / 2), 3)
    const firstHalf = paragraphs.slice(0, midPoint).join('</p>') + '</p>'
    const secondHalf = paragraphs.slice(midPoint).join('</p>') + (paragraphs.length > midPoint ? '</p>' : '')

    return (
      <div>
        <div className={proseClasses} dangerouslySetInnerHTML={{ __html: firstHalf }} />
        <div className="my-6 not-prose">{widgets[0]}</div>
        <div className={proseClasses} dangerouslySetInnerHTML={{ __html: secondHalf }} />
      </div>
    )
  }

  // Multiple widgets — spread evenly across article
  const interval = Math.floor(totalParagraphs / (insertCount + 1))
  const insertPoints = Array.from({ length: insertCount }, (_, i) => interval * (i + 1))

  // Build segments
  const segments: { html: string; widget?: ReactNode }[] = []
  let lastIdx = 0

  insertPoints.forEach((point, i) => {
    const html = paragraphs.slice(lastIdx, point).join('</p>') + '</p>'
    segments.push({ html, widget: widgets[i] })
    lastIdx = point
  })

  // Remaining paragraphs
  if (lastIdx < paragraphs.length) {
    segments.push({ html: paragraphs.slice(lastIdx).join('</p>') + '</p>' })
  }

  return (
    <div>
      {segments.map((seg, i) => (
        <div key={i}>
          <div className={proseClasses} dangerouslySetInnerHTML={{ __html: seg.html }} />
          {seg.widget && <div className="my-6 not-prose">{seg.widget}</div>}
        </div>
      ))}
    </div>
  )
}
