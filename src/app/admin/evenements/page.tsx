import Link from "next/link";
import { Calendar, Eye } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getRecentEvents } from "@/lib/events/queries";
import { formatDateRange, isPast } from "@/lib/utils";

export const metadata = {
  title: "Modération des Événements | Super Admin | Event",
  description: "Validation et mise en avant des événements sur la plateforme.",
};

/** Libellé et ton du statut d'un événement, en tenant compte des dates passées. */
function statusPresentation(status: string, endAt: string) {
  if (status === "published") {
    return isPast(endAt)
      ? { label: "Terminé", tone: "neutral" as const }
      : { label: "Publié", tone: "success" as const };
  }
  if (status === "cancelled") return { label: "Annulé", tone: "danger" as const };
  if (status === "completed") return { label: "Terminé", tone: "neutral" as const };
  return { label: "Brouillon", tone: "warning" as const };
}

export default async function AdminEvenementsPage() {
  const events = await getRecentEvents(25);

  const publishedCount = events.filter((event) => event.status === "published").length;
  const visibleCount = events.filter(
    (event) => event.status === "published" && !isPast(event.end_at),
  ).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Modération des Événements</h1>
        <p className="text-sm text-fg-muted">
          Événements publiés sur le réseau et état de leur visibilité publique.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Événements Publiés sur le Réseau</CardTitle>
          <p className="text-xs text-fg-muted">
            {publishedCount} publié{publishedCount > 1 ? "s" : ""} · {visibleCount} visible
            {visibleCount > 1 ? "s" : ""} dans Explorer (publié et non terminé)
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {events.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Aucun événement visible"
                description="Aucun événement n'est lisible avec ce compte. Les brouillons des autres organisations restent privés (RLS)."
              />
            </div>
          ) : (
            events.map((event) => {
              const { label, tone } = statusPresentation(event.status, event.end_at);

              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-bg-subtle"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-fg">{event.title}</span>
                      <Badge variant={tone}>{label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-fg-subtle">
                      Organisé par {event.organizationName} ·{" "}
                      {formatDateRange(event.start_at, event.end_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {event.status === "published" && !isPast(event.end_at) ? (
                      <Link
                        href={`/evenements/${event.slug}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-bg-muted"
                      >
                        <Eye className="size-4" aria-hidden="true" /> Fiche publique
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-fg-subtle">
        <Calendar className="size-4" aria-hidden="true" />
        Un événement n&apos;apparaît dans Explorer que s&apos;il est publié ET si sa date de fin est à
        venir.
      </p>
    </div>
  );
}
