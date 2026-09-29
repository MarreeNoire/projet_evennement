"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

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
  const [events, setEvents] = useState<EventListItem[]>(initialEvents ?? []);

  useEffect(() => {
    // Charger aussi les brouillons locaux enregistrés en mode fallback si présent
    try {
      const localDraftsRaw = localStorage.getItem("rassemble_draft_events");
      if (localDraftsRaw) {
        const localDrafts: EventListItem[] = JSON.parse(localDraftsRaw);
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newDrafts = localDrafts.filter((d) => !existingIds.has(d.id));
          return [...newDrafts, ...prev];
        });
      }
    } catch {
      // Ignorer erreurs de parse localStorage
    }
  }, []);

  const displayList = events;

  const filteredEvents = displayList.filter((event) => {
    if (filter === "published") return event.status === "published";
    if (filter === "draft") return event.status === "draft";
    return true;
  });

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
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filter === "all" ? "bg-primary text-white" : "text-fg-muted hover:bg-bg-muted"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter("published")}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filter === "published" ? "bg-primary text-white" : "text-fg-muted hover:bg-bg-muted"
              }`}
            >
              Publiés
            </button>
            <button
              onClick={() => setFilter("draft")}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filter === "draft" ? "bg-primary text-white" : "text-fg-muted hover:bg-bg-muted"
              }`}
            >
              Brouillons
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-sm text-fg-muted">
              Aucun événement ne correspond à ce filtre.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isDraft = event.status === "draft";
              const formattedDate = new Date(event.start_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <div
                  key={event.id}
                  className="flex min-w-0 flex-col items-start gap-3 p-4 transition-colors hover:bg-bg-subtle sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="break-words font-bold text-fg">{event.title}</span>
                      {isDraft ? (
                        <Badge variant="warning">Brouillon</Badge>
                      ) : (
                        <Badge variant="success">Publié</Badge>
                      )}
                    </div>
                    <p className="break-words text-xs text-fg-muted">
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
      </CardContent>
    </Card>
  );
}
