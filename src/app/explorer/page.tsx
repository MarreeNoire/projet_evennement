import type { Metadata } from "next";

import { EventHorizontalList } from "@/components/events/event-horizontal-list";
import { ExploreFiltersBar } from "@/components/events/explore-filters";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getCategoryLabel } from "@/lib/constants";
import { getEventCities, searchPublishedEvents, type ExploreFilters } from "@/lib/events/queries";
import { isDateInput } from "@/lib/events/date-range";

export const metadata: Metadata = { title: "Explorer les événements" };

const SORT_VALUES = ["date_asc", "date_desc", "price_asc", "price_desc"] as const;
type SortValue = (typeof SORT_VALUES)[number];

function toSort(value: string | undefined): SortValue {
  return (SORT_VALUES as readonly string[]).includes(value ?? "")
    ? (value as SortValue)
    : "date_asc";
}

/* Explorer : recherche + filtres + pagination via l'URL. */

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const requestedStartDate = first(params.du);
  const requestedEndDate = first(params.au);
  const startDate = isDateInput(requestedStartDate) ? requestedStartDate : undefined;
  const endDate =
    isDateInput(requestedEndDate) && (!startDate || requestedEndDate >= startDate)
      ? requestedEndDate
      : undefined;

  const filters: ExploreFilters = {
    query: first(params.q),
    category: first(params.categorie),
    city: first(params.ville),
    startDate,
    endDate,
    freeOnly: first(params.gratuit) === "1",
    sort: toSort(first(params.tri)),
    page: Math.max(Number(first(params.page) ?? 1) || 1, 1),
    pageSize: 12,
  };

  let result: Awaited<ReturnType<typeof searchPublishedEvents>> | null = null;
  let cities: string[] = [];
  let loadError = false;

  try {
    [result, cities] = await Promise.all([searchPublishedEvents(filters), getEventCities()]);
  } catch {
    loadError = true;
  }

  const events = result?.events ?? [];
  const total = result?.total ?? 0;
  const page = result?.page ?? 1;
  const totalPages = result?.totalPages ?? 1;

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    if (filters.query) next.set("q", filters.query);
    if (filters.category) next.set("categorie", filters.category);
    if (filters.city) next.set("ville", filters.city);
    if (filters.startDate) next.set("du", filters.startDate);
    if (filters.endDate) next.set("au", filters.endDate);
    if (filters.sort && filters.sort !== "date_asc") next.set("tri", filters.sort);
    if (filters.freeOnly) next.set("gratuit", "1");
    if (p > 1) next.set("page", String(p));
    const query = next.toString();
    return query ? `/explorer?${query}` : "/explorer";
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="explorer-page container-page flex flex-col gap-8 py-10">
          <div className="border-border border-t pt-4">
            <p className="eyebrow">Agenda</p>
            <h1 className="font-display mt-2 text-4xl leading-[1.02] font-semibold md:text-5xl">
              Explorer
            </h1>
            <p className="text-fg-muted mt-2 text-sm">
              {filters.category
                ? `Catégorie : ${getCategoryLabel(filters.category)}`
                : "Tous les événements à venir."}
            </p>
          </div>

          <ExploreFiltersBar cities={cities} total={total} />

          {loadError ? (
            <EmptyState
              title="Recherche momentanément indisponible"
              description="Réessaie dans un instant."
            />
          ) : events.length === 0 ? (
            <EmptyState
              title="Aucun événement trouvé"
              description="Essaie d'autres mots-clés ou réinitialise les filtres."
              action={<ButtonLink href="/explorer">Voir tous les événements</ButtonLink>}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <p className="text-fg-muted text-xs">
                  Fais défiler horizontalement pour parcourir les {total} événement
                  {total > 1 ? "s" : ""}.
                </p>
              </div>
              <EventHorizontalList events={events} />
              {totalPages > 1 ? (
                <nav
                  aria-label="Pagination"
                  className="flex items-center justify-center gap-2 pt-2"
                >
                  {page > 1 ? (
                    <ButtonLink href={pageHref(page - 1)} variant="secondary" size="sm">
                      ← Page précédente
                    </ButtonLink>
                  ) : null}
                  <span className="text-fg-muted text-sm" role="status">
                    Page {page} sur {totalPages}
                  </span>
                  {page < totalPages ? (
                    <ButtonLink href={pageHref(page + 1)} variant="secondary" size="sm">
                      Page suivante →
                    </ButtonLink>
                  ) : null}
                </nav>
              ) : null}
            </div>
          )}
      </main>
      <SiteFooter />
    </div>
  );
}
