function EventCardSkeleton() {
  return (
    <div className="border-border-strong/70 bg-surface w-[78vw] min-w-[16rem] shrink-0 overflow-hidden rounded-xl border sm:w-[20rem] md:w-[21rem]">
      <div className="bg-bg-muted aspect-[16/8] animate-pulse" />
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex justify-between gap-4">
          <div className="bg-bg-muted h-5 w-2/3 animate-pulse rounded-sm" />
          <div className="bg-bg-muted size-11 animate-pulse rounded-sm" />
        </div>
        <div className="bg-bg-muted h-3 w-1/2 animate-pulse rounded-sm" />
        <div className="border-border mt-2 flex justify-between border-t pt-3">
          <div className="bg-bg-muted h-4 w-20 animate-pulse rounded-sm" />
          <div className="bg-bg-muted h-4 w-24 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <main
      className="container-page flex flex-col gap-8 py-10"
      aria-busy="true"
      aria-label="Chargement des événements"
    >
      <div className="border-border border-t pt-4">
        <div className="bg-bg-muted h-3 w-16 animate-pulse rounded-sm" />
        <div className="bg-bg-muted mt-3 h-11 w-56 animate-pulse rounded-sm" />
        <div className="bg-bg-muted mt-3 h-4 w-64 max-w-full animate-pulse rounded-sm" />
      </div>
      <div className="border-border bg-surface grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-bg-muted h-11 animate-pulse rounded-sm" />
        ))}
      </div>
      <div className="no-scrollbar flex gap-5 overflow-hidden" role="presentation">
        {Array.from({ length: 3 }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
