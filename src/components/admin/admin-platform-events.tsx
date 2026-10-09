"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, Eye, Search } from "lucide-react";

import { AdminEventDeleteControl } from "@/components/admin/admin-event-delete-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatDateRange, isPast } from "@/lib/utils";
import type { AdminEventListItem } from "@/lib/events/queries";

type EventFilter = "all" | "published" | "draft" | "finished" | "cancelled";

const filters: { id: EventFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "published", label: "Publiés" },
  { id: "draft", label: "En préparation" },
  { id: "finished", label: "Terminés" },
  { id: "cancelled", label: "Annulés" },
];

function presentation(event: AdminEventListItem) {
  if (event.status === "cancelled") return { label: "Annulé", tone: "danger" as const, group: "cancelled" as const };
  if (event.status === "completed" || (event.status === "published" && isPast(event.end_at))) {
    return { label: "Terminé", tone: "neutral" as const, group: "finished" as const };
  }
  if (event.status === "published") return { label: "Publié", tone: "success" as const, group: "published" as const };
  return { label: "En préparation", tone: "warning" as const, group: "draft" as const };
}

export function AdminPlatformEvents({ events }: { events: AdminEventListItem[] }) {
  const [filter, setFilter] = useState<EventFilter>("all");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => {
    const grouped = events.map(presentation);
    return {
      all: events.length,
      published: grouped.filter((item) => item.group === "published").length,
      draft: grouped.filter((item) => item.group === "draft").length,
      finished: grouped.filter((item) => item.group === "finished").length,
      cancelled: grouped.filter((item) => item.group === "cancelled").length,
    };
  }, [events]);

  const visibleEvents = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr");
    return events.filter((event) => {
      const status = presentation(event).group;
      const matchesFilter = filter === "all" || status === filter;
      const matchesQuery = !term || `${event.title} ${event.organizationName}`.toLocaleLowerCase("fr").includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [events, filter, query]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Modération des événements</h1>
        <p className="mt-1 text-sm text-fg-muted">Retrouve un événement, vérifie sa visibilité et accède rapidement à sa fiche.</p>
      </header>

      <section aria-label="Événements de la plateforme" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Événements de la plateforme</h2>
            <p className="mt-0.5 text-sm text-fg-muted">Les {events.length} plus récents</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Rechercher un événement ou une organisation</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Événement ou organisation"
              className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm"
            />
          </label>
        </div>

        <div aria-label="Filtrer par statut" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${filter === id ? "border-primary bg-primary-subtle text-primary-subtle-fg" : "border-border bg-surface text-fg-muted hover:bg-bg-muted hover:text-fg"}`}
            >
              {label}<span className="tabular-nums text-xs opacity-75">{counts[id]}</span>
            </button>
          ))}
        </div>

        {visibleEvents.length === 0 ? (
          <Card><CardContent className="p-5 sm:p-7">
            <EmptyState
              title={events.length ? "Aucun résultat" : "Aucun événement"}
              description={events.length ? "Essaie un autre terme ou choisis un autre statut." : "Les événements créés sur la plateforme apparaîtront ici."}
            />
          </CardContent></Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <ul className="divide-y divide-border">
              {visibleEvents.map((event) => {
                const status = presentation(event);
                const isPublic = status.group === "published";
                return (
                  <li key={event.id} className="p-4 transition-colors hover:bg-bg-subtle sm:p-5">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="min-w-0 break-words font-semibold leading-snug text-fg">{event.title}</h3>
                          <Badge variant={status.tone}>{status.label}</Badge>
                        </div>
                        <p className="break-words text-sm text-fg-muted">{event.organizationName}</p>
                        <p className="flex items-start gap-1.5 text-xs text-fg-subtle">
                          <Calendar className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          <span>{formatDateRange(event.start_at, event.end_at)}</span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 border-t border-border pt-3 sm:shrink-0 sm:flex-row sm:items-center sm:border-0 sm:pt-0">
                        {isPublic ? (
                          <Link
                            href={`/evenements/${event.slug}`}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-fg hover:bg-bg-muted"
                          >
                            <Eye className="size-4" aria-hidden="true" /> Voir la fiche
                          </Link>
                        ) : null}
                        <AdminEventDeleteControl eventId={event.id} title={event.title} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="text-xs leading-5 text-fg-subtle">Un événement apparaît dans Explorer s’il est publié et si sa date de fin est à venir.</p>
      </section>
    </div>
  );
}
