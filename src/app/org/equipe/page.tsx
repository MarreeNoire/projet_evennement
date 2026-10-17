import { OrgTeamManager, type TeamMember } from "@/components/events/org-team-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ORG_ROLE_LABELS, type OrgRole } from "@/lib/constants";

export const metadata = {
  title: "Gestion de l'Équipe | Espace Organisateur",
  description: "Gérez les collaborateurs et leurs rôles d'accès sur l'application.",
};

export default async function OrgEquipePage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <OrgTeamManager />;

  const userId = auth.user.id;

  // Rechercher l'organisation possédée ou gérée
  let orgId: string | null = null;
  let orgName = "Mon Organisation";
  let ownerId: string | null = null;
  let currentUserRole: "owner" | "manager" | "checkin_agent" | "moderator" = "owner";

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id, name, owner_id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownedOrg) {
    orgId = ownedOrg.id;
    orgName = ownedOrg.name;
    ownerId = ownedOrg.owner_id;
    currentUserRole = "owner";
  } else {
    // Si l'utilisateur est membre d'une organisation
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(id, name, owner_id)")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("role", ["owner", "manager", "checkin_agent", "moderator"])
      .maybeSingle();

    if (membership && membership.organizations) {
      const org = membership.organizations as any;
      orgId = org.id;
      orgName = org.name;
      ownerId = org.owner_id;
      currentUserRole = membership.role as any;
    }
  }

  if (!orgId) {
    return <OrgTeamManager initialMembers={[]} />;
  }

  // Récupérer les membres et le propriétaire
  const [{ data: members }, { data: ownerProfile }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, user_id, invited_email, role, status, joined_at")
      .eq("organization_id", orgId)
      .order("joined_at", { ascending: true }),
    ownerId
      ? supabase
          .from("profiles")
          .select("id, display_name, full_name, email, avatar_url")
          .eq("id", ownerId)
          .maybeSingle()
      : { data: null },
  ]);

  const memberUserIds = [
    ...new Set(
      (members ?? [])
        .map((m) => m.user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: memberProfiles } = memberUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, full_name, email, avatar_url")
        .in("id", memberUserIds)
    : { data: [] };

  const profilesById = new Map((memberProfiles ?? []).map((p) => [p.id, p]));

  const initialMembers: TeamMember[] = [
    ...(ownerProfile
      ? [
          {
            id: `owner-${ownerProfile.id}`,
            userId: ownerProfile.id,
            name: ownerProfile.full_name || ownerProfile.display_name,
            email: ownerProfile.email || "",
            avatarUrl: ownerProfile.avatar_url,
            role: "owner" as const,
            roleLabel: "Propriétaire",
            status: "active",
          },
        ]
      : []),
    ...(members ?? []).map((m) => {
      const profile = m.user_id ? profilesById.get(m.user_id) : null;
      const role = (m.role || "manager") as "owner" | "manager" | "checkin_agent" | "moderator";
      return {
        id: m.id,
        userId: m.user_id ?? undefined,
        name:
          profile?.full_name ||
          profile?.display_name ||
          m.invited_email?.split("@")[0] ||
          "Collaborateur",
        email: profile?.email || m.invited_email || "Utilisateur de l'application",
        avatarUrl: profile?.avatar_url,
        role,
        roleLabel: ORG_ROLE_LABELS[role as OrgRole] || role,
        status: m.status,
        joinedAt: m.joined_at,
      };
    }),
  ];

  return (
    <OrgTeamManager
      organizationId={orgId}
      organizationName={orgName}
      initialMembers={initialMembers}
      currentUserRole={currentUserRole}
    />
  );
}
