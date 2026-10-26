/**
 * Homepage loading skeleton — copied verbatim from the old Next.js
 * `src/app/loading.tsx`. Shown when the homepage API is unreachable (same
 * fallback behaviour as before). Pure markup, no interactivity.
 */
export function HomeSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <section className="container-main py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main slider */}
          <div className="lg:col-span-2">
            <div className="aspect-[16/9] rounded-xl bg-gray-200 dark:bg-gray-800" />
          </div>
          {/* Berita Terbaru sidebar */}
          <div className="space-y-4">
            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-16 w-20 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-2 w-24 rounded bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Columns Skeleton */}
      <section className="container-main py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="mb-4 flex items-center justify-between">
                <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex gap-3">
                    <div className="h-14 w-20 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Story Skeleton */}
      <section className="container-main py-8">
        <div className="mb-5 h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 sm:w-48">
              <div className="aspect-[9/16] rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mt-1 h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </section>

      {/* Banner Exclusive Skeleton */}
      <section className="py-8">
        <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </section>

      {/* e-Koran Skeleton */}
      <section className="py-10">
        <div className="h-80 rounded-lg bg-gray-300 dark:bg-gray-800" />
      </section>

      {/* Photo News Skeleton */}
      <section className="container-main py-8">
        <div className="mb-6 h-6 w-36 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </section>

      {/* Explore News Skeleton */}
      <section className="container-main py-8">
        <div className="mb-6 h-6 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-[72px] w-[120px] shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden w-80 shrink-0 space-y-4 lg:block">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 w-8 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-14 w-14 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
