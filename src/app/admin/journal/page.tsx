import { ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const metadata = {
  title: "Journal d’audit | Administration | Event",
  description: "Historique des opérations administratives sensibles.",
};

type AuditDetails = Record<string, Json | undefined>;

function asDetails(value: Json | null): AuditDetails {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AuditDetails)
    : {};
}

function stringValue(value: Json | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function roleLabel(role: Json | undefined): string {
  if (role === "admin") return "Administrateur";
  if (role === "organizer") return "Organisateur";
  if (role === "participant") return "Participant";
  return "rôle inconnu";
}

function statusLabel(status: Json | undefined): string {
  if (status === "processing") return "en cours de traitement";
  if (status === "paid") return "versé";
  if (status === "failed") return "en échec";
  if (status === "resolved") return "traité";
  if (status === "dismissed") return "classé sans suite";
  if (status === "open") return "ouvert";
  if (status === "reviewing") return "en cours d’examen";
  if (status === "cancelled") return "annulé";
  return "mis à jour";
}

function actionTitle(action: string): string {
  const titles: Record<string, string> = {
    "user.role.grant": "Rôle attribué",
    "user.role.revoke": "Rôle retiré",
    "profile.verify": "Profil vérifié",
    "profile.unverify": "Vérification retirée",
    "user.ban": "Compte banni",
    "user.unban": "Compte rétabli",
    "event.delete": "Événement supprimé",
    "event.remove": "Événement retiré de la plateforme",
    "report.resolve": "Signalement traité",
    "platform.commission.update": "Commission de la plateforme modifiée",
    "payout.processing": "Reversement mis en traitement",
    "payout.paid": "Reversement marqué comme versé",
    "payout.failed": "Échec du reversement enregistré",
  };
  return titles[action] ?? "Mise à jour effectuée";
}

function entityLabel(entityType: string): string {
  if (["profile", "user", "user_role"].includes(entityType)) return "Utilisateur";
  if (entityType === "event") return "Événement";
  if (entityType === "payout") return "Reversement";
  if (entityType === "report") return "Signalement";
  if (entityType === "platform_setting") return "Plateforme";
  return "Administration";
}

function actionDescription(
  action: string,
  targetName: string,
  beforeValue: Json | null,
  afterValue: Json | null,
): string {
  const before = asDetails(beforeValue);
  const after = asDetails(afterValue);
  const eventName = stringValue(before.title) ?? targetName;

  if (action === "user.role.grant" || action === "user.role.revoke") {
    const role = roleLabel(after.role ?? before.role);
    return action === "user.role.grant"
      ? `Le rôle « ${role} » a été attribué à ${targetName}.`
      : `Le rôle « ${role} » a été retiré à ${targetName}.`;
  }
  if (action === "profile.verify") return `Le profil de ${targetName} a été vérifié.`;
  if (action === "profile.unverify") return `La vérification du profil de ${targetName} a été retirée.`;
  if (action === "user.ban") return `Le compte de ${targetName} a été bloqué.`;
  if (action === "user.unban") return `Le compte de ${targetName} peut de nouveau se connecter.`;
  if (action === "event.delete") return `L’événement « ${eventName} » a été supprimé.`;
  if (action === "event.remove") return `L’événement « ${eventName} » a été retiré. Les commandes et billets sont conservés.`;
  if (action === "report.resolve") {
    const status = statusLabel(after.status);
    return after.hidden === true
      ? `Le signalement a été ${status} et le contenu concerné a été masqué.`
      : `Le signalement a été ${status}.`;
  }
  if (action === "platform.commission.update") {
    const oldRate = typeof before.rate === "number" ? `${(before.rate * 100).toLocaleString("fr-FR")} %` : null;
    const newRate = typeof after.rate === "number" ? `${(after.rate * 100).toLocaleString("fr-FR")} %` : null;
    return oldRate && newRate
      ? `La commission est passée de ${oldRate} à ${newRate}.`
      : "Le taux de commission de la plateforme a été modifié.";
  }
  if (action.startsWith("payout.")) {
    return `Le reversement est maintenant ${statusLabel(after.status)}.`;
  }
  return `Une action administrative a été effectuée concernant ${targetName.toLocaleLowerCase("fr-FR")}.`;
}

export default async function AdminJournalPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, event_id, before, after, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const profileIds = [...new Set((rows ?? []).flatMap((row) => [
    row.actor_id,
    ["profile", "user", "user_role"].includes(row.entity_type) ? row.entity_id : null,
  ].filter((id): id is string => Boolean(id))))];
  const eventIds = [...new Set((rows ?? []).flatMap((row) => [
    row.event_id,
    row.entity_type === "event" ? row.entity_id : null,
  ].filter((id): id is string => Boolean(id))))];

  const [profileResult, eventResult] = await Promise.all([
    profileIds.length
      ? supabase.from("profiles").select("id, display_name, full_name, email").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase.from("events").select("id, title").in("id", eventIds)
      : Promise.resolve({ data: [] }),
  ]);
  const profileNames = new Map((profileResult.data ?? []).map((profile) => [
    profile.id,
    profile.display_name || profile.full_name || profile.email || "Utilisateur",
  ]));
  const eventNames = new Map((eventResult.data ?? []).map((event) => [event.id, event.title]));

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Journal des actions</h1>
        <p className="text-sm text-fg-muted">Les 100 opérations administratives récentes, expliquées simplement.</p>
      </header>
      {error ? <Card><CardContent className="p-5 text-sm text-danger">Impossible de charger le journal. Réessayez.</CardContent></Card> : rows?.length ? (
        <ol className="space-y-3">
          {rows.map((row) => {
            const targetName = row.entity_type === "event"
              ? eventNames.get(row.entity_id ?? "") ?? stringValue(asDetails(row.before).title) ?? "cet événement"
              : ["profile", "user", "user_role"].includes(row.entity_type)
                ? profileNames.get(row.entity_id ?? "") ?? "cet utilisateur"
                : entityLabel(row.entity_type).toLocaleLowerCase("fr-FR");
            const actorName = row.actor_id
              ? profileNames.get(row.actor_id) ?? "Administrateur"
              : "Système";

            return (
              <li key={row.id}>
                <Card>
                  <CardContent className="space-y-2 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{entityLabel(row.entity_type)}</Badge>
                      <span className="font-semibold text-fg">{actionTitle(row.action)}</span>
                      <time className="ml-auto text-xs text-fg-muted" dateTime={row.created_at}>
                        {new Date(row.created_at).toLocaleString("fr-FR")}
                      </time>
                    </div>
                    <p className="text-sm text-fg-muted">
                      {actionDescription(row.action, targetName, row.before, row.after)}
                    </p>
                    <p className="text-xs text-fg-subtle">Action effectuée par {actorName}.</p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      ) : (
        <Card><CardContent className="flex flex-col items-center gap-3 p-8 text-center"><ScrollText className="size-8 text-fg-subtle" /><h2 className="font-semibold text-fg">Aucune action enregistrée</h2><p className="text-sm text-fg-muted">Les nouvelles opérations administratives apparaîtront ici.</p></CardContent></Card>
      )}
    </div>
  );
}
