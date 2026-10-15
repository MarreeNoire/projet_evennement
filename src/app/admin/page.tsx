import { Calendar, CircleDollarSign, Clock, FileWarning, ScrollText, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getRecentEvents } from "@/lib/events/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, isPast } from "@/lib/utils";

export const metadata = {
  title: "Administration | Event",
  description: "Indicateurs réels et accès aux opérations de la plateforme.",
};

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [eventsCount, publishedCount, draftsCount, profilesCount, reportsCount, payoutRows, recentEvents] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("payouts").select("net_amount, status").in("status", ["pending", "processing"]),
    getRecentEvents(5),
  ]);

  const eventsAvailable = !eventsCount.error;
  const eventBreakdownAvailable = !publishedCount.error && !draftsCount.error;
  const profilesAvailable = !profilesCount.error;
  const reportsAvailable = !reportsCount.error;
  const payoutsAvailable = !payoutRows.error;
  const pendingPayoutCount = payoutRows.data?.length ?? 0;
  const pendingAmount = (payoutRows.data ?? []).reduce((sum, payout) => sum + payout.net_amount, 0);
  const pendingReports = reportsCount.count ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Vue d’ensemble</h1>
        <p className="text-sm text-fg-muted">Indicateurs consolidés de la plateforme et accès aux opérations à traiter.</p>
      </header>

      <section aria-labelledby="admin-activity-heading" className="space-y-2.5 sm:space-y-3">
        <h2 id="admin-activity-heading" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Activité de la plateforme</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Événements" value={eventsAvailable ? String(eventsCount.count ?? 0) : "—"} hint={eventsAvailable ? eventBreakdownAvailable ? `${publishedCount.count ?? 0} publiés · ${draftsCount.count ?? 0} brouillons` : "Répartition indisponible" : "Données indisponibles"} icon={<Calendar className="size-5" />} compact className="p-3 sm:p-4" />
        <StatCard label="Comptes inscrits" value={profilesAvailable ? String(profilesCount.count ?? 0) : "—"} hint="Total des profils enregistrés" icon={<Users className="size-5" />} compact className="p-3 sm:p-4" />
        <StatCard label="Signalements ouverts" value={reportsAvailable ? String(pendingReports) : "—"} hint="À examiner par la modération" icon={<FileWarning className="size-5 text-warning" />} compact className="p-3 sm:p-4" />
        <StatCard label="Reversements en attente" value={payoutsAvailable ? formatPrice(pendingAmount) : "—"} hint={payoutsAvailable ? `${pendingPayoutCount} demande${pendingPayoutCount > 1 ? "s" : ""}` : "Données indisponibles"} icon={<Wallet className="size-5" />} compact className="p-3 sm:p-4" />
      </div>
      </section>

      <section aria-labelledby="admin-operations-heading" className="space-y-2.5 sm:space-y-3">
      <h2 id="admin-operations-heading" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Suivi et actions</h2>
      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3"><CardTitle className="text-base">Événements récents</CardTitle><ButtonLink href="/admin/evenements" variant="ghost" size="sm">Tout voir</ButtonLink></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {recentEvents.length ? recentEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{event.title}</p><p className="text-xs text-fg-subtle">{event.organizationName} · {formatDate(event.start_at)}</p></div>
                <Badge variant={event.status === "published" ? isPast(event.end_at) ? "neutral" : "success" : event.status === "cancelled" ? "danger" : "warning"}>{event.status === "published" ? isPast(event.end_at) ? "Terminé" : "Publié" : event.status === "cancelled" ? "Annulé" : event.status === "completed" ? "Terminé" : "Brouillon"}</Badge>
              </div>
            )) : <EmptyState title="Aucun événement" description="Les événements visibles par l’administration apparaîtront ici." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3"><CardTitle className="text-base">Actions rapides</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
            <ButtonLink href="/admin/moderation" variant="secondary" aria-label="Modérer les signalements" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm"><FileWarning className="mr-2 size-4 shrink-0" /> Signalements{reportsAvailable && pendingReports ? ` (${pendingReports})` : ""}</ButtonLink>
            <ButtonLink href="/admin/paiements" variant="secondary" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm"><CircleDollarSign className="mr-2 size-4 shrink-0" /> Reversements</ButtonLink>
            <ButtonLink href="/admin/utilisateurs" variant="secondary" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm"><Users className="mr-2 size-4 shrink-0" /> Utilisateurs</ButtonLink>
            <ButtonLink href="/admin/journal" variant="secondary" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm"><ScrollText className="mr-2 size-4 shrink-0" /> Journal d’audit</ButtonLink>
          </CardContent>
        </Card>
      </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-fg-subtle"><Clock className="size-4" /> Les statistiques sont calculées depuis les données accessibles avec les droits administrateur.</p>
    </div>
  );
}
