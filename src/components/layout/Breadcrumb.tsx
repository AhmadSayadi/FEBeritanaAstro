import Link from 'next/link'

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
            {item.href ? (
              <Link href={item.href} className="hover:text-primary/80">
                {item.name}
              </Link>
            ) : (
              <span>{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
