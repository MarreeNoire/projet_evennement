import { BarChart3, CalendarDays, TicketCheck, Wallet } from "lucide-react";

import { StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getOrganizerEvents } from "@/lib/events/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatNumber, formatPrice, formatPercent } from "@/lib/utils";

export const metadata = {
  title: "Statistiques | Event",
  description: "Ventes et fréquentation de vos événements.",
};

interface EventStatsRow {
  tickets_sold: number;
  gross_revenue: number;
  checked_in: number;
  capacity: number | null;
}

export default async function OrgAnalyticsPage() {
  const events = await getOrganizerEvents();
  let stats: EventStatsRow[] = [];

  if (events.length > 0) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("event_stats")
        .select("tickets_sold, gross_revenue, checked_in, capacity")
        .in("event_id", events.map((event) => event.id));
      stats = (data as EventStatsRow[] | null) ?? [];
    } catch {
      stats = [];
    }
  }

  const ticketsSold = stats.reduce((sum, item) => sum + item.tickets_sold, 0);
  const grossRevenue = stats.reduce((sum, item) => sum + item.gross_revenue, 0);
  const checkedIn = stats.reduce((sum, item) => sum + item.checked_in, 0);
  const capacity = stats.reduce((sum, item) => sum + (item.capacity ?? 0), 0);
  const occupancy = capacity > 0 ? formatPercent(ticketsSold / capacity) : "Non renseigné";

  return (
    <div className="space-y-8">
      <header className="border-b border-border-strong pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Statistiques</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Ventes et entrées enregistrées pour les événements que vous gérez.
        </p>
      </header>

      {stats.length === 0 ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Aucune statistique disponible"
          description="Les données de vente apparaîtront ici lorsqu’un événement sera créé et que des billets seront enregistrés."
        />
      ) : (
        <>
          <p className="text-xs font-medium text-fg-subtle">
            {formatNumber(stats.length)} événement{stats.length > 1 ? "s" : ""} avec des données
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Revenus bruts"
              value={formatPrice(grossRevenue)}
              icon={<Wallet className="size-5" />}
            />
            <StatCard
              label="Billets vendus"
              value={formatNumber(ticketsSold)}
              icon={<TicketCheck className="size-5" />}
            />
            <StatCard
              label="Entrées contrôlées"
              value={formatNumber(checkedIn)}
              icon={<CalendarDays className="size-5" />}
            />
            <StatCard
              label="Remplissage"
              value={occupancy}
              hint={capacity > 0 ? `${formatNumber(ticketsSold)} sur ${formatNumber(capacity)} places` : undefined}
              icon={<BarChart3 className="size-5" />}
            />
          </div>
        </>
      )}
    </div>
  );
}
