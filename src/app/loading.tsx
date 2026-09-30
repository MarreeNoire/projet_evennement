import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      aria-label="Chargement de la page"
      className="mx-auto flex min-h-[45vh] w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex items-center gap-3 text-sm font-medium text-fg-muted">
        <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
        Chargement de la page…
      </div>
      <div className="mb-6 h-8 w-2/5 animate-pulse rounded-sm bg-bg-muted" />
      <div className="mb-8 h-4 w-3/5 animate-pulse rounded-sm bg-bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="overflow-hidden border border-border bg-surface">
            <div className="aspect-16/10 animate-pulse bg-bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded-sm bg-bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded-sm bg-bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
