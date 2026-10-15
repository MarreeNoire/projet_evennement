import { Card, CardContent } from "@/components/ui/card";
import { AdminModerationList, type AdminReportItem } from "@/components/admin/admin-moderation-list";
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

  const items: AdminReportItem[] = (reports ?? []).map((report) => ({
    id: report.id,
    targetLabel: targetLabels[report.target_type] ?? report.target_type,
    status: report.status,
    reason: REPORT_REASONS.find((item) => item.value === report.reason)?.label ?? "Autre",
    details: report.details,
    targetId: report.target_id,
    createdAt: report.created_at,
    canHide: ["post", "comment", "message"].includes(report.target_type),
  }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Signalements</h1>
        <p className="text-sm text-fg-muted">Examinez les signalements ouverts. Toute décision est enregistrée dans le journal d’administration.</p>
      </div>
      {error ? <Card><CardContent className="p-5 text-sm text-danger">Impossible de charger les signalements. Actualisez la page ou vérifiez la configuration de la base.</CardContent></Card> : <AdminModerationList reports={items} />}
    </div>
  );
}
