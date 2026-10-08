function ChatSkeleton() {
  return (
    <section className="border-border bg-surface overflow-hidden rounded-2xl border">
      <div className="border-border flex items-center gap-3 border-b p-4">
        <div className="bg-bg-muted size-10 animate-pulse rounded-xl" />
        <div className="flex flex-col gap-2">
          <div className="bg-bg-muted h-3 w-36 animate-pulse rounded-sm" />
          <div className="bg-bg-muted h-3 w-24 animate-pulse rounded-sm" />
        </div>
      </div>
      <div className="bg-bg-subtle/60 flex min-h-[55dvh] flex-col justify-end gap-5 p-4 sm:p-5">
        <div className="bg-bg-muted h-16 w-3/5 animate-pulse self-start rounded-2xl" />
        <div className="bg-bg-muted h-12 w-2/5 animate-pulse self-end rounded-2xl" />
        <div className="bg-bg-muted h-20 w-1/2 animate-pulse self-start rounded-2xl" />
      </div>
      <div className="border-border flex gap-3 border-t p-4">
        <div className="bg-bg-muted h-12 flex-1 animate-pulse rounded-2xl" />
        <div className="bg-bg-muted size-12 animate-pulse rounded-2xl" />
      </div>
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
          <ChatSkeleton />
        </div>
        <aside className="border-border bg-surface hidden h-56 animate-pulse rounded-lg border lg:block" />
      </div>
    </main>
  );
}
