function FeedSkeleton() {
  return (
    <section className="flex flex-col gap-4" aria-label="Chargement des publications">
      <div className="border-border bg-surface h-28 animate-pulse rounded-xl border" />
      <div className="border-border bg-surface h-56 animate-pulse rounded-xl border" />
      <div className="border-border bg-surface h-48 animate-pulse rounded-xl border" />
    </section>
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
          <FeedSkeleton />
        </div>
        <aside className="border-border bg-surface hidden h-56 animate-pulse rounded-lg border lg:block" />
      </div>
    </main>
  );
}
