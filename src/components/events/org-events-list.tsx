"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarPlus,
  Edit,
  ExternalLink,
  MapPin,
  Search,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatDateRange, isPast, cn } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/constants";

const PAGE_SIZE = 8;

export interface EventListItem {
  id: string;
  title: string;
  status: string;
  start_at: string;
  end_at?: string;
  venue_name?: string | null;
  city?: string | null;
  slug?: string;
  cover_url?: string | null;
  category?: string;
  tickets_sold_text?: string;
}

export function OrgEventsList({ initialEvents }: { initialEvents?: EventListItem[] }) {
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const serverEvents = initialEvents ?? [];

  const searchedEvents = serverEvents.filter((event) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      (event.city && event.city.toLowerCase().includes(query)) ||
      (event.venue_name && event.venue_name.toLowerCase().includes(query))
    );
  });

  const filteredEvents = searchedEvents.filter((event) => {
    if (filter === "published") return event.status === "published";
    if (filter === "draft") return event.status === "draft";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (serverEvents.length === 0) {
    return (
      <EmptyState
        icon={<CalendarPlus className="text-primary size-7" />}
        title="Aucun événement pour le moment"
        description="Créez votre premier événement et configurez votre billetterie : il apparaîtra aussitôt dans Explorer dès sa publication."
        action={<ButtonLink href="/org/evenements/nouveau">Créer un événement</ButtonLink>}
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border/70 p-4 sm:p-5 bg-surface/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold">Vos Événements</CardTitle>
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
              {filteredEvents.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Champ de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-fg-subtle pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full sm:w-52 rounded-lg border border-border bg-surface pl-8 pr-3 text-xs placeholder:text-fg-subtle focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/30"
              />
            </div>

            {/* Filtres par statut */}
            <div role="group" aria-label="Filtrer les événements" className="flex rounded-lg border border-border p-0.5 bg-surface-sunken">
              <button
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  filter === "all"
                    ? "bg-surface text-fg shadow-xs"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                Tous
              </button>
              <button
                type="button"
                aria-pressed={filter === "published"}
                onClick={() => {
                  setFilter("published");
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  filter === "published"
                    ? "bg-surface text-fg shadow-xs"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                Publiés
              </button>
              <button
                type="button"
                aria-pressed={filter === "draft"}
                onClick={() => {
                  setFilter("draft");
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  filter === "draft"
                    ? "bg-surface text-fg shadow-xs"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                Brouillons
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {filteredEvents.length === 0 ? (
            <div className="text-fg-muted p-10 text-center text-sm space-y-1">
              <p className="font-semibold text-fg">Aucun événement ne correspond à vos critères</p>
              <p className="text-xs text-fg-subtle">Essayez de modifier votre recherche ou le filtre de statut.</p>
            </div>
          ) : (
            pageEvents.map((event) => {
              const isDraft = event.status === "draft";
              const finished = event.end_at ? isPast(event.end_at) : false;

              return (
                <div
                  key={event.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-colors hover:bg-surface-raised/60"
                >
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                    {/* Miniature Cover */}
                    <div className="relative size-14 sm:size-16 rounded-lg overflow-hidden border border-border bg-bg-muted shrink-0 shadow-xs">
                      {event.cover_url ? (
                        <Image src={event.cover_url} alt={event.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                          <Calendar className="size-6" />
                        </div>
                      )}
                    </div>

                    {/* Informations événement */}
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-fg truncate">
                          {event.title}
                        </span>
                        {isDraft ? (
                          <Badge variant="warning">Brouillon</Badge>
                        ) : finished ? (
                          <Badge variant="neutral">Terminé</Badge>
                        ) : (
                          <Badge variant="success">Publié</Badge>
                        )}
                        {event.category && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-2xs text-fg-subtle">
                            <Tag className="size-3 text-primary" /> {getCategoryLabel(event.category)}
                          </span>
                        )}
                      </div>

                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5 text-primary" />
                          {event.start_at
                            ? formatDateRange(
                                event.start_at,
                                event.end_at ?? event.start_at,
                              )
                            : "Date à préciser"}
                        </span>
                        {(event.venue_name || event.city) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-primary" />
                            {event.venue_name ? `${event.venue_name}` : ""}
                            {event.city ? ` (${event.city})` : ""}
                          </span>
                        )}
                      </p>

                      {event.tickets_sold_text && (
                        <p className="text-2xs text-fg-subtle font-medium">
                          {event.tickets_sold_text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {event.slug && event.status === "published" && (
                      <ButtonLink
                        href={`/evenements/${event.slug}`}
                        target="_blank"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-xs text-fg-muted hover:text-fg"
                        title="Voir la page publique"
                      >
                        <ExternalLink className="size-3.5" />
                      </ButtonLink>
                    )}

                    <ButtonLink
                      href={`/org/evenements/${event.id}`}
                      variant="primary"
                      size="sm"
                      className="h-9 px-3.5 text-xs gap-1.5 shadow-xs"
                    >
                      <Edit className="size-3.5" /> Gérer l&apos;événement
                    </ButtonLink>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredEvents.length > PAGE_SIZE && (
          <nav
            aria-label="Pagination des événements"
            className="border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface/50"
          >
            <p className="text-xs text-fg-muted" role="status" aria-live="polite">
              Événements {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredEvents.length)} sur {filteredEvents.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold text-fg hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft className="size-3.5" /> Précédent
              </button>

              <span className="text-xs text-fg-muted px-2 tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold text-fg hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Suivant <ArrowRight className="size-3.5" />
              </button>
            </div>
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
