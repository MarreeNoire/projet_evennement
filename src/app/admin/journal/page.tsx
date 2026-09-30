import { ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const metadata = {
  title: "Journal d’audit | Administration | Event",
  description: "Historique des opérations administratives sensibles.",
};

function summarize(value: Json | null) {
  if (value === null) return null;
  const serialized = JSON.stringify(value);
  return serialized.length > 300 ? `${serialized.slice(0, 297)}…` : serialized;
}

export default async function AdminJournalPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, before, after, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Journal d’audit</h1>
        <p className="text-sm text-fg-muted">Les 100 opérations les plus récentes, en lecture seule.</p>
      </header>
      {error ? <Card><CardContent className="p-5 text-sm text-danger">Impossible de charger le journal. Vérifiez la migration d’administration et les droits du compte.</CardContent></Card> : rows?.length ? (
        <ol className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card><CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="info">{row.entity_type}</Badge><span className="font-semibold text-fg">{row.action}</span><time className="ml-auto text-xs text-fg-muted" dateTime={row.created_at}>{new Date(row.created_at).toLocaleString("fr-FR")}</time></div>
                <p className="break-all text-xs text-fg-subtle">Administrateur : {row.actor_id || "système"}{row.entity_id ? ` · Cible : ${row.entity_id}` : ""}</p>
                {row.before || row.after ? <details className="text-xs"><summary className="min-h-9 cursor-pointer font-medium text-primary">Voir le détail de l’opération</summary><div className="grid gap-2 sm:grid-cols-2"><pre className="overflow-auto whitespace-pre-wrap break-all rounded-md bg-bg-muted p-2">Avant : {summarize(row.before) ?? "—"}</pre><pre className="overflow-auto whitespace-pre-wrap break-all rounded-md bg-bg-muted p-2">Après : {summarize(row.after) ?? "—"}</pre></div></details> : null}
              </CardContent></Card>
            </li>
          ))}
        </ol>
      ) : (
        <Card><CardContent className="flex flex-col items-center gap-3 p-8 text-center"><ScrollText className="size-8 text-fg-subtle" /><h2 className="font-semibold text-fg">Aucune opération enregistrée</h2><p className="text-sm text-fg-muted">Les nouvelles actions sensibles apparaîtront ici.</p></CardContent></Card>
      )}
    </div>
  );
}
