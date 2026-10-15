import { OrgTeamManager } from "@/components/events/org-team-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Gestion de l'Équipe | Espace Organisateur | Event",
  description: "Gérez les collaborateurs et leurs rôles d'accès.",
};

export default async function OrgEquipePage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <OrgTeamManager />;

  const { data: organization } = await supabase.from("organizations").select("id, owner_id").eq("owner_id", auth.user.id).maybeSingle();
  const orgId = organization?.id;
  if (!orgId) return <OrgTeamManager />;

  const [{ data: members }, { data: owner }] = await Promise.all([
    supabase.from("organization_members").select("id, user_id, invited_email, role, status").eq("organization_id", orgId).order("joined_at", { ascending: true }),
    supabase.from("profiles").select("id, display_name, full_name, email").eq("id", organization.owner_id).maybeSingle(),
  ]);
  const memberUserIds = [...new Set((members ?? []).map((member) => member.user_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = memberUserIds.length
    ? await supabase.from("profiles").select("id, display_name, full_name, email").in("id", memberUserIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const roleLabels: Record<string, string> = { owner: "Propriétaire", manager: "Gestionnaire", checkin_agent: "Agent de contrôle", moderator: "Modérateur" };
  const initialMembers = [
    ...(owner ? [{ id: `owner-${owner.id}`, name: owner.full_name || owner.display_name, email: owner.email || "", role: "owner" as const, roleLabel: roleLabels.owner!, status: "active" }] : []),
    ...(members ?? []).map((member) => {
      const profile = member.user_id ? profilesById.get(member.user_id) : null;
      const role = member.role as "owner" | "manager" | "checkin_agent" | "moderator";
      return { id: member.id, name: profile?.full_name || profile?.display_name || member.invited_email?.split("@")[0] || "Collaborateur", email: profile?.email || member.invited_email || "", role, roleLabel: roleLabels[role] || "Membre", status: member.status };
    }),
  ];
  return <OrgTeamManager initialMembers={initialMembers} />;
}
