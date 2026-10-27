import Link from '@/compat/Link'

interface BreadcrumbItem {
  name: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="container-main py-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-primary">
        <li>
          <Link href="/" className="hover:text-primary/80">
            Beranda
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <span aria-hidden="true">&gt;</span>
            {/* `.trim()` + no surrounding whitespace in JSX: Astro's HTML
                compressor and React's JSX whitespace rules can disagree on a
                stray space around {item.name} (server "Politik" vs client
                " Politik"), causing a text hydration mismatch (React #418). A
                trimmed single expression with tight tags renders identically on
                both sides. */}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary/80">{item.name.trim()}</Link>
            ) : (
              <span>{item.name.trim()}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
