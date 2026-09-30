import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import { ProfileVerificationControl } from "@/components/admin/profile-verification-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Fiche utilisateur | Administration | Event",
  description: "Détails réels d'un compte utilisateur et actions de vérification.",
};

export default async function AdminUtilisateurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, email, username, phone, city, country, bio, is_verified, onboarding_completed, created_at, last_seen_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !profile) notFound();

  const [roleResult, ordersResult, ownedOrgs, memberships] = await Promise.all([
    supabase.from("user_roles").select("role, granted_at").eq("user_id", id).order("granted_at", { ascending: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("organizations").select("id, name, is_active").eq("owner_id", id),
    supabase.from("organization_members").select("id, organization_id, role, status").eq("user_id", id),
  ]);

  const roles = roleResult.data ?? [];
  const memberOrgIds = (memberships.data ?? []).map((membership) => membership.organization_id);
  const { data: memberOrganizations } = memberOrgIds.length
    ? await supabase.from("organizations").select("id, name").in("id", memberOrgIds)
    : { data: [] };
  const organizationNames = new Map((memberOrganizations ?? []).map((organization) => [organization.id, organization.name]));
  const organizations = [
    ...(ownedOrgs.data ?? []).map((organization) => ({ name: organization.name, role: "Propriétaire", active: organization.is_active })),
    ...(memberships.data ?? []).map((membership) => ({
      name: organizationNames.get(membership.organization_id),
      role: membership.role,
      active: membership.status === "active",
    })),
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/utilisateurs" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Retour aux utilisateurs</Link>
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">{profile.display_name || profile.full_name || "Compte sans nom"}</h1>
          {profile.is_verified ? <Badge variant="success"><ShieldCheck className="size-3" /> Vérifié</Badge> : <Badge variant="neutral">Non vérifié</Badge>}
        </div>
        {profile.username ? <p className="mt-1 text-sm text-fg-muted">@{profile.username}</p> : null}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informations du compte</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="flex items-center gap-3 break-all"><Mail className="size-4 shrink-0 text-fg-subtle" />{profile.email || "E-mail non renseigné"}</p>
            <p className="flex items-center gap-3"><Phone className="size-4 shrink-0 text-fg-subtle" />{profile.phone || "Téléphone non renseigné"}</p>
            <p className="flex items-center gap-3"><MapPin className="size-4 shrink-0 text-fg-subtle" />{[profile.city, profile.country].filter(Boolean).join(", ") || "Localisation non renseignée"}</p>
            <p className="flex items-center gap-3"><CalendarDays className="size-4 shrink-0 text-fg-subtle" />Inscrit le {new Date(profile.created_at).toLocaleDateString("fr-FR")}</p>
            <p className="flex items-center gap-3"><UserRound className="size-4 shrink-0 text-fg-subtle" />Onboarding {profile.onboarding_completed ? "terminé" : "non terminé"} · {profile.last_seen_at ? `Vu le ${new Date(profile.last_seen_at).toLocaleDateString("fr-FR")}` : "Dernière activité inconnue"}</p>
            {profile.bio ? <p className="whitespace-pre-wrap border-t border-border pt-3 text-fg-muted">{profile.bio}</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Rôles et activité</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">{roles.length ? roles.map((role) => <Badge key={role.role} variant={role.role === "admin" ? "danger" : role.role === "organizer" ? "accent" : "neutral"}>{role.role}</Badge>) : <Badge variant="neutral">Participant</Badge>}</div>
              <p className="flex items-center gap-2 text-sm text-fg-muted"><Ticket className="size-4" /> {ordersResult.count ?? 0} commande(s)</p>
              <div className="space-y-2 border-t border-border pt-3">
                <h2 className="text-sm font-semibold text-fg">Organisations</h2>
                {organizations.length ? organizations.map((organization, index) => <p key={`${organization.name}-${index}`} className="text-sm text-fg-muted">{organization.name || "Organisation"} · {organization.role}{organization.active ? "" : " · inactive"}</p>) : <p className="text-sm text-fg-muted">Aucune organisation associée.</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Vérification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-fg-muted">Le badge de vérification est visible dans l’application. Chaque changement est conservé dans le journal admin.</p>
              <ProfileVerificationControl userId={profile.id} isVerified={profile.is_verified} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
