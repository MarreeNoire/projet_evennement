import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/* =============================================================================
   États de chargement
   --------------------------------------------------------------------------
   On privilégie les squelettes aux roues de chargement : le gabarit reste
   stable, ce qui réduit la perception d'attente et évite les sauts de mise en
   page (bon pour le CLS).
   ========================================================================== */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

/** Squelette de carte d'événement : même gabarit que la carte réelle. */
export function EventCardSkeleton() {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-sm border">
      <Skeleton className="aspect-16/9 rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Squelette de liste (participants, billets, commandes). */
export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-border flex items-center gap-3 rounded-xl border p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Squelette de tableau de bord (cartes de statistiques). */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-border bg-surface rounded-sm border p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Indicateur pour les actions courtes et indéterminées. */
export function Spinner({
  className,
  label = "Chargement…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      className={cn("text-fg-muted inline-flex items-center gap-2 text-sm", className)}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}
