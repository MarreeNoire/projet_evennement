function PostSkeleton() {
  return (
    <article className="border-border bg-surface rounded-lg border p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="bg-bg-muted size-10 animate-pulse rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="bg-bg-muted h-3 w-28 animate-pulse rounded-sm" />
          <div className="bg-bg-muted h-3 w-20 animate-pulse rounded-sm" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <div className="bg-bg-muted h-3 w-full animate-pulse rounded-sm" />
        <div className="bg-bg-muted h-3 w-4/5 animate-pulse rounded-sm" />
        <div className="bg-bg-muted mt-2 h-36 animate-pulse rounded-md" />
      </div>
      <div className="border-border mt-4 flex gap-4 border-t pt-3">
        <div className="bg-bg-muted h-8 w-20 animate-pulse rounded-sm" />
        <div className="bg-bg-muted h-8 w-24 animate-pulse rounded-sm" />
      </div>
    </article>
  );
}

export default function SalonLoading() {
  return (
    <main
      className="container-page flex flex-col gap-6 py-8"
      aria-busy="true"
      aria-label="Chargement du salon"
    >
      <div className="border-border bg-surface flex items-center gap-4 rounded-lg border p-4 sm:p-6">
        <div className="bg-bg-muted size-14 shrink-0 animate-pulse rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="bg-bg-muted h-6 w-2/3 max-w-72 animate-pulse rounded-sm" />
          <div className="bg-bg-muted h-3 w-full max-w-96 animate-pulse rounded-sm" />
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4">
          <div className="border-border bg-surface h-28 animate-pulse rounded-lg border" />
          <PostSkeleton />
          <PostSkeleton />
        </div>
        <aside className="border-border bg-surface hidden h-56 animate-pulse rounded-lg border lg:block" />
      </div>
    </main>
  );
}
