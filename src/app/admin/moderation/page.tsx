import { Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportActions } from "@/components/admin/report-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REPORT_REASONS } from "@/lib/constants";

export const metadata = {
  title: "Centre de modération | Administration | Event",
  description: "Examiner et traiter les signalements de la communauté.",
};

const targetLabels: Record<string, string> = { post: "Publication", comment: "Commentaire", user: "Utilisateur", event: "Événement", message: "Message" };

export default async function AdminModerationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: reports, error } = await supabase.from("reports").select("*").in("status", ["open", "reviewing"]).order("created_at", { ascending: true }).limit(100);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Signalements</h1>
        <p className="text-sm text-fg-muted">Examinez les signalements ouverts. Toute décision est enregistrée dans le journal d’administration.</p>
      </div>
      {error ? <Card><CardContent className="p-5 text-sm text-danger">Impossible de charger les signalements. Actualisez la page ou vérifiez la configuration de la base.</CardContent></Card> : reports?.length ? (
        <ul className="space-y-3">
          {reports.map((report) => {
            const reason = REPORT_REASONS.find((item) => item.value === report.reason)?.label ?? "Autre";
            const canHide = ["post", "comment", "message"].includes(report.target_type);
            return (
              <li key={report.id}>
                <Card><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="warning">{targetLabels[report.target_type] ?? report.target_type}</Badge><Badge variant="neutral">{report.status === "reviewing" ? "En examen" : "Nouveau"}</Badge></div>
                    <h2 className="font-semibold text-fg">{reason}</h2>
                    {report.details ? <p className="whitespace-pre-wrap break-words text-sm text-fg-muted">{report.details}</p> : <p className="text-sm text-fg-muted">Aucun détail fourni.</p>}
                    <p className="break-all text-xs text-fg-subtle">Cible : {report.target_id} · Reçu le {new Date(report.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                  <ReportActions reportId={report.id} canHide={canHide} />
                </CardContent></Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card><CardContent className="flex flex-col items-center gap-3 p-8 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-success-subtle text-success"><Flag className="size-5" /></span><h2 className="font-semibold text-fg">Aucun signalement en attente</h2><p className="max-w-md text-sm text-fg-muted">Les nouveaux signalements envoyés par les utilisateurs apparaîtront ici.</p></CardContent></Card>
      )}
    </div>
  );
}
