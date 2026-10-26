import Link from 'next/link'

interface TagsCloudProps {
  tags: { name: string; slug: string }[]
}

export function TagsCloud({ tags }: TagsCloudProps) {
  if (!tags.length) return null

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
        <span className="inline-block h-4 w-1 bg-primary" aria-hidden="true"></span>
        Tags Populer
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/tag/${tag.slug}`}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            #{tag.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
