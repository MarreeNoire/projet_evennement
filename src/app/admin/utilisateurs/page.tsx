import Link from "next/link";
import { Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Gestion des utilisateurs | Administration | Event",
  description: "Consulter les comptes et les rôles de la plateforme.",
};

export default async function AdminUtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim().slice(0, 100);
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("id, display_name, full_name, email, username, is_verified, created_at").order("created_at", { ascending: false }).limit(100);
  if (term) {
    const safeTerm = term.replace(/[,%()]/g, " ").trim();
    if (safeTerm) query = query.or(`display_name.ilike.%${safeTerm}%,full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%,username.ilike.%${safeTerm}%`);
  }
  const { data: profiles, error } = await query;
  const userIds = (profiles ?? []).map((profile) => profile.id);
  const roleResult = userIds.length
    ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
    : { data: [], error: null };
  const roles = roleResult.data ?? [];
  const rolesLoadError = Boolean(roleResult.error);
  const rolesByUser = new Map<string, string[]>();
  for (const role of roles ?? []) rolesByUser.set(role.user_id, [...(rolesByUser.get(role.user_id) ?? []), role.role]);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-fg-muted">Comptes inscrits et rôles attribués. Les 100 profils les plus récents sont affichés.</p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-5">
          <form action="/admin/utilisateurs" method="get" role="search" className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <input name="q" type="search" defaultValue={term} placeholder="Nom, e-mail ou identifiant" aria-label="Rechercher un utilisateur" className="h-10 w-full rounded-md border border-border bg-transparent pl-9 pr-3 text-sm focus:border-border-focus focus:outline-none" />
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? <p role="alert" className="p-5 text-sm text-danger">Impossible de charger les utilisateurs. Réessayez.</p> : profiles?.length ? (
            <ul className="divide-y divide-border">
              {profiles.map((profile) => {
                const userRoles = rolesByUser.get(profile.id) ?? [];
                return (
                  <li key={profile.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{profile.display_name || profile.full_name || "Compte sans nom"}</p>
                      <p className="truncate text-xs text-fg-muted">{profile.email || (profile.username ? `@${profile.username}` : "E-mail non renseigné")}</p>
                      <p className="mt-1 text-xs text-fg-subtle">Inscrit le {new Date(profile.created_at).toLocaleDateString("fr-FR")}{profile.is_verified ? " · Profil vérifié" : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2" aria-label="Rôles">
                      {rolesLoadError ? <Badge variant="warning">Rôles indisponibles</Badge> : userRoles.length ? userRoles.map((role) => <Badge key={role} variant={role === "admin" ? "danger" : role === "organizer" ? "accent" : "neutral"}>{role === "admin" ? "Administrateur" : role === "organizer" ? "Organisateur" : "Participant"}</Badge>) : <Badge variant="neutral">Aucun rôle</Badge>}
                      <Link href={`/admin/utilisateurs/${profile.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-fg hover:bg-bg-muted"><Users className="size-3.5" aria-hidden="true" /> Gérer</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="p-6 text-center text-sm text-fg-muted">Aucun utilisateur correspondant.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
