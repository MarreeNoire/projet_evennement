"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

const PAGE_SIZE = 10;

export interface EventListItem {
  id: string;
  title: string;
  status: string;
  start_at: string;
  venue_name?: string | null;
  city?: string | null;
  slug?: string;
  tickets_sold_text?: string;
}

export function OrgEventsList({ initialEvents }: { initialEvents?: EventListItem[] }) {
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const serverEvents = initialEvents ?? [];
  const displayList = serverEvents;

  const filteredEvents = displayList.filter((event) => {
    if (filter === "published") return event.status === "published";
    if (filter === "draft") return event.status === "draft";
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Aucun événement réel : on ne montre jamais de données fictives, l'organisateur
  // doit comprendre que rien n'est encore visible dans Explorer.
  if (displayList.length === 0) {
    return (
      <EmptyState
        icon={<CalendarPlus />}
        title="Aucun événement pour le moment"
        description="Créez votre premier événement et publiez-le : il apparaîtra aussitôt dans Explorer."
        action={<ButtonLink href="/org/evenements/nouveau">Créer un événement</ButtonLink>}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Liste de vos événements</CardTitle>
          <div className="flex flex-wrap gap-1 text-xs">
            <button
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filter === "all" ? "bg-primary text-white" : "text-fg-muted hover:bg-bg-muted"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => {
                setFilter("published");
                setPage(1);
              }}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filter === "published" ? "bg-primary text-white" : "text-fg-muted hover:bg-bg-muted"
              }`}
            >
              Publiés
            </button>
            <button
              onClick={() => {
                setFilter("draft");
                setPage(1);
              }}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filter === "draft" ? "bg-primary text-white" : "text-fg-muted hover:bg-bg-muted"
              }`}
            >
              Brouillons
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-border divide-y">
          {filteredEvents.length === 0 ? (
            <div className="text-fg-muted p-8 text-center text-sm">
              Aucun événement ne correspond à ce filtre.
            </div>
          ) : (
            pageEvents.map((event) => {
              const isDraft = event.status === "draft";
              const formattedDate = new Date(event.start_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <div
                  key={event.id}
                  className="hover:bg-bg-subtle flex min-w-0 flex-col items-start gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-fg font-bold break-words">{event.title}</span>
                      {isDraft ? (
                        <Badge variant="warning">Brouillon</Badge>
                      ) : (
                        <Badge variant="success">Publié</Badge>
                      )}
                    </div>
                    <p className="text-fg-muted text-xs break-words">
                      {formattedDate} {event.venue_name ? `· ${event.venue_name}` : ""}{" "}
                      {event.city ? `(${event.city})` : ""}
                    </p>
                    {event.tickets_sold_text ? (
                      <p className="text-2xs text-fg-subtle">{event.tickets_sold_text}</p>
                    ) : null}
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <ButtonLink href={`/org/evenements/${event.id}`} variant="secondary" size="sm">
                      <Edit className="mr-1.5 size-3.5" /> Gérer
                    </ButtonLink>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {filteredEvents.length > PAGE_SIZE ? (
          <nav
            aria-label="Pagination des événements"
            className="border-border flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-fg-muted text-xs" role="status" aria-live="polite">
              Événements {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredEvents.length)} sur {filteredEvents.length}
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="border-border text-fg inline-flex min-h-10 items-center gap-1.5 border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Précédent
              </button>
              <span className="text-fg-muted px-2 text-xs tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="border-border text-fg inline-flex min-h-10 items-center gap-1.5 border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                Suivant <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        ) : null}
      </CardContent>
    </Card>
  );
}
