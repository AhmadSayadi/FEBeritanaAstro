import Link from '@/compat/Link'
import { Article, Category } from '@/lib/types'
import { ArticleCard } from '@/components/article/ArticleCard'

interface CategoryColumnProps {
  title: string
  slug: string
  color: string
  articles: Article[]
}

function CategoryColumn({ title, slug, color, articles }: CategoryColumnProps) {
  const [main, ...rest] = articles

  if (articles.length === 0) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <span className="inline-block h-5 w-1 rounded" style={{ backgroundColor: color }} aria-hidden="true"></span>
            {title}
          </h2>
          <Link href={`/${slug}`} className="text-xs text-gray-500 hover:text-primary">
            Lihat semua
          </Link>
        </div>
        <p className="text-sm text-gray-400">Belum ada berita</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-5 w-1 rounded" style={{ backgroundColor: color }} aria-hidden="true"></span>
          {title}
        </h2>
        <Link href={`/${slug}`} className="text-xs text-gray-500 hover:text-primary">
          Lihat semua
        </Link>
      </div>
      {main && <ArticleCard article={main} size="medium" />}
      <div className="mt-4 space-y-3">
        {rest.slice(0, 2).map((article) => (
          <ArticleCard key={article.id} article={article} size="small" />
        ))}
      </div>
    </div>
  )
}

interface CategoryColumnsProps {
  columns: {
    category: Category
    articles: Article[]
  }[]
  // Legacy props (backward compat — remove when fully migrated)
  olahraga?: Article[]
  politik?: Article[]
  hiburan?: Article[]
}

export function CategoryColumns({ columns, olahraga, politik, hiburan }: CategoryColumnsProps) {
  // Use new API format if columns provided
  if (columns && columns.length > 0) {
    return (
      <section aria-label="Berita per kategori" className="py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((col) => (
            <CategoryColumn
              key={col.category.slug}
              title={col.category.name}
              slug={col.category.slug}
              color={col.category.color || '#E53935'}
              articles={col.articles}
            />
          ))}
        </div>
      </section>
    )
  }

  // Legacy fallback (old ok.surf format)
  return (
    <section aria-label="Berita per kategori" className="py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {olahraga && <CategoryColumn title="Olahraga" slug="olahraga" color="#16A34A" articles={olahraga} />}
        {politik && <CategoryColumn title="Politik" slug="politik" color="#2563EB" articles={politik} />}
        {hiburan && <CategoryColumn title="Hiburan" slug="hiburan" color="#7C3AED" articles={hiburan} />}
      </div>
    </section>
  )
}
