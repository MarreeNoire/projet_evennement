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
  const profilesAvailable = !profilesCount.error;
  const reportsAvailable = !reportsCount.error;
  const payoutsAvailable = !payoutRows.error;
  const pendingPayoutCount = payoutRows.data?.length ?? 0;
  const pendingAmount = (payoutRows.data ?? []).reduce((sum, payout) => sum + payout.net_amount, 0);
  const pendingReports = reportsCount.count ?? 0;

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Vue d’ensemble</h1>
        <p className="text-sm text-fg-muted">Indicateurs consolidés de la plateforme et accès aux opérations à traiter.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Événements" value={eventsAvailable ? String(eventsCount.count ?? 0) : "—"} hint={eventsAvailable ? `${publishedCount.count ?? 0} publiés · ${draftsCount.count ?? 0} brouillons` : "Données indisponibles"} icon={<Calendar className="size-5" />} />
        <StatCard label="Comptes inscrits" value={profilesAvailable ? String(profilesCount.count ?? 0) : "—"} hint="Total des profils enregistrés" icon={<Users className="size-5" />} />
        <StatCard label="Signalements ouverts" value={reportsAvailable ? String(pendingReports) : "—"} hint="À examiner par la modération" icon={<FileWarning className="size-5 text-warning" />} />
        <StatCard label="Reversements en attente" value={payoutsAvailable ? formatPrice(pendingAmount) : "—"} hint={payoutsAvailable ? `${pendingPayoutCount} demande${pendingPayoutCount > 1 ? "s" : ""}` : "Données indisponibles"} icon={<Wallet className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">Événements récents</CardTitle><ButtonLink href="/admin/evenements" variant="ghost" size="sm">Tous les événements</ButtonLink></CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.length ? recentEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{event.title}</p><p className="text-xs text-fg-subtle">{event.organizationName} · {formatDate(event.start_at)}</p></div>
                <Badge variant={event.status === "published" ? isPast(event.end_at) ? "neutral" : "success" : event.status === "cancelled" ? "danger" : "warning"}>{event.status === "published" ? isPast(event.end_at) ? "Terminé" : "Publié" : event.status === "cancelled" ? "Annulé" : event.status === "completed" ? "Terminé" : "Brouillon"}</Badge>
              </div>
            )) : <EmptyState title="Aucun événement" description="Les événements visibles par l’administration apparaîtront ici." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Opérations administratives</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <ButtonLink href="/admin/moderation" variant="secondary" className="min-h-12 justify-start"><FileWarning className="mr-2 size-4" /> Modérer les signalements{reportsAvailable && pendingReports ? ` (${pendingReports})` : ""}</ButtonLink>
            <ButtonLink href="/admin/paiements" variant="secondary" className="min-h-12 justify-start"><CircleDollarSign className="mr-2 size-4" /> Suivre les reversements</ButtonLink>
            <ButtonLink href="/admin/utilisateurs" variant="secondary" className="min-h-12 justify-start"><Users className="mr-2 size-4" /> Consulter les utilisateurs</ButtonLink>
            <ButtonLink href="/admin/journal" variant="secondary" className="min-h-12 justify-start"><ScrollText className="mr-2 size-4" /> Journal d’audit</ButtonLink>
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-xs text-fg-subtle"><Clock className="size-4" /> Les statistiques sont calculées depuis les données accessibles avec les droits administrateur.</p>
    </div>
  );
}
