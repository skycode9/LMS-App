import { Skeleton } from "@/components/ui/skeleton"

/**
 * The route-level loading state for the three signed-in shells. It sits
 * inside each group's layout, so the sidebar and header stay put and only the
 * page area shimmers while a Server Component streams in — roughly the shape
 * most dashboard pages share: a title, a row of stat cards, then content.
 */
function PageSkeleton() {
  return (
    <main
      className="w-full px-6 py-6 md:px-8 md:py-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </main>
  )
}

export { PageSkeleton }
