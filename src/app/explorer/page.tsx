import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { EditorialEventGrid } from "@/components/editorial/event-card";
import { ExploreFiltersBar } from "@/components/events/explore-filters";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";
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

  const activeLabel = filters.category ? getCategoryLabel(filters.category) : null;

  return (
    <EditorialShell>
      <div className={`${shell.wrap} ${shell.page}`} style={{ display: "grid", gap: 32 }}>
        <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
          <div>
            <p className={shell.eyebrow}>Agenda</p>
            <h1 className={shell["page-title"]} style={{ marginTop: 14 }}>
              {activeLabel ? (
                <>
                  Sorties <em>{activeLabel.toLowerCase()}</em>
                </>
              ) : (
                <>
                  Toutes les <em>sorties.</em>
                </>
              )}
            </h1>
          </div>
          <p className={shell["page-lead"]}>
            {filters.city ? `À ${filters.city}. ` : ""}
            {total > 0
              ? `${total} événement${total > 1 ? "s" : ""} publié${total > 1 ? "s" : ""} par leurs organisateurs.`
              : "Les événements publiés par leurs organisateurs, à Abidjan et partout en Côte d’Ivoire."}
          </p>
        </header>

        <ExploreFiltersBar cities={cities} total={total} />

        {loadError ? (
          <div className={shell.empty}>
            <h2>Recherche momentanément indisponible</h2>
            <p>La liste n’a pas pu être chargée. Réessaie dans un instant.</p>
            <Link href="/explorer" className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}>
              Recharger la liste
            </Link>
          </div>
        ) : events.length === 0 ? (
          <div className={shell.empty}>
            <h2>Aucun événement trouvé</h2>
            <p>
              Essaie un autre mot-clé, une autre ville, ou réinitialise les filtres pour voir tout
              l’agenda.
            </p>
            <Link href="/explorer" className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}>
              Voir tous les événements
            </Link>
          </div>
        ) : (
          <div className={content.section} id="resultats">
            <div className={shell["section-head"]}>
              <h2 className={shell["section-title"]}>
                {filters.query ? `Résultats pour « ${filters.query} »` : "À l’affiche"}
              </h2>
              <span className={shell["mono-label"]}>
                Page {page} / {totalPages}
              </span>
            </div>

            <EditorialEventGrid events={events} />

            {totalPages > 1 ? (
              <nav className={shell.pager} aria-label="Pagination">
                <span>
                  Page {page} sur {totalPages}
                </span>
                <div className={shell["pager-links"]}>
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}
                    >
                      <ArrowLeft aria-hidden="true" className={shell.icon} />
                      Précédente
                    </Link>
                  ) : null}
                  {page < totalPages ? (
                    <Link
                      href={pageHref(page + 1)}
                      className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}
                    >
                      Suivante
                      <ArrowRight aria-hidden="true" className={shell.icon} />
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </div>
        )}
      </div>
    </EditorialShell>
  );
}
