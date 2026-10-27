"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { type OrgRole, ORG_ROLE_LABELS } from "@/lib/constants";

export interface SearchUserProfile {
  id: string;
  displayName: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/** Recherche d'utilisateurs inscrits sur l'application pour les inviter dans l'équipe */
export async function searchAppUsersAction(
  query: string,
  organizationId: string,
): Promise<{ ok: boolean; users?: SearchUserProfile[]; error?: string }> {
  const clean = query.trim().replace(/[%_]/g, "");
  if (!clean || clean.length < 2) {
    return { ok: true, users: [] };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    if (!organizationId) return { ok: false, error: "Organisation non identifiée." };

    const { data: profiles, error } = await supabase.rpc("search_team_invite_profiles", {
      search_query: clean,
      organization_id: organizationId,
      result_limit: 10,
    });

    if (error) {
      console.error("[searchAppUsersAction] Error:", error);
      return { ok: false, error: "Erreur lors de la recherche d'utilisateurs." };
    }

    const users: SearchUserProfile[] = (profiles ?? []).map((p) => ({
      id: p.id,
      displayName: p.display_name || p.full_name || "Utilisateur",
      username: p.username,
      fullName: p.full_name,
      email: null,
      avatarUrl: p.avatar_url,
    }));

    return { ok: true, users };
  } catch (err: any) {
    console.error("[searchAppUsersAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/** Vérifie si l'utilisateur courant est propriétaire ou gestionnaire de l'organisation */
async function canManageTeam(supabase: any, organizationId: string, userId: string): Promise<boolean> {
  const [{ data: org }, { data: membership }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, owner_id")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select("id, role, status")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "active")
      .in("role", ["owner", "manager"])
      .maybeSingle(),
  ]);

  if (org?.owner_id === userId) return true;
  if (membership) return true;
  return false;
}

/** Invite un membre de l'application dans l'équipe de l'organisation */
export async function inviteTeamMemberAction(input: {
  organizationId: string;
  targetUserId: string;
  role: "manager" | "checkin_agent" | "moderator";
}): Promise<{ ok: boolean; member?: any; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const canManage = await canManageTeam(supabase, input.organizationId, user.id);
    if (!canManage) {
      return {
        ok: false,
        error: "Vous n'avez pas les autorisations pour inviter des membres dans cette organisation.",
      };
    }

    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, owner_id")
      .eq("id", input.organizationId)
      .single();

    if (!organization) {
      return { ok: false, error: "Organisation introuvable." };
    }

    if (organization.owner_id === input.targetUserId) {
      return { ok: false, error: "Cet utilisateur est déjà le propriétaire de l'organisation." };
    }

    // Récupérer le profil du membre invité
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, display_name, full_name, email, avatar_url")
      .eq("id", input.targetUserId)
      .single();

    if (!targetProfile) {
      return { ok: false, error: "Le profil de cet utilisateur est introuvable." };
    }

    // Vérifier si déjà membre
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("id, role, status")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.targetUserId)
      .maybeSingle();

    let memberId: string;

    if (existingMember) {
      if (existingMember.status === "active") {
        return {
          ok: false,
          error: `Cet utilisateur fait déjà partie de l'équipe (Rôle actuel : ${ORG_ROLE_LABELS[existingMember.role as OrgRole] ?? existingMember.role}). Modifiez son rôle si besoin.`,
        };
      }

      // Réactivation
      const { data: updated, error: updateError } = await supabase
        .from("organization_members")
        .update({
          role: input.role,
          status: "active",
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        })
        .eq("id", existingMember.id)
        .select("id")
        .single();

      if (updateError || !updated) {
        return { ok: false, error: updateError?.message || "Impossible d'activer le membre." };
      }
      memberId = updated.id;
    } else {
      // Insertion directe du membre avec user_id
      const { data: inserted, error: insertError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: input.organizationId,
          user_id: input.targetUserId,
          role: input.role,
          status: "active",
          invited_by: user.id,
          invited_email: targetProfile.email,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return {
          ok: false,
          error: insertError?.message || "Impossible d'enregistrer le membre dans l'équipe.",
        };
      }
      memberId = inserted.id;
    }

    // Envoi d'une notification intégrée dans l'application
    try {
      const adminClient = createSupabaseAdminClient();
      const roleLabel = ORG_ROLE_LABELS[input.role] ?? input.role;
      const targetUrl = input.role === "checkin_agent" ? "/org/check-in" : "/org";

      await adminClient.from("notifications").insert({
        user_id: input.targetUserId,
        type: "new_member",
        title: `Équipe ${organization.name}`,
        body: `Vous avez été ajouté à l'équipe en tant que ${roleLabel}. Vous avez désormais accès aux outils dédiés.`,
        url: targetUrl,
        actor_id: user.id,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[inviteTeamMemberAction] Notification warning:", notifErr);
    }

    revalidatePath("/org/equipe");
    revalidatePath("/org");

    return {
      ok: true,
      member: {
        id: memberId,
        userId: targetProfile.id,
        name: targetProfile.full_name || targetProfile.display_name,
        email: targetProfile.email || "",
        avatarUrl: targetProfile.avatar_url,
        role: input.role,
        roleLabel: ORG_ROLE_LABELS[input.role],
        status: "active",
      },
    };
  } catch (err: any) {
    console.error("[inviteTeamMemberAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/** Modifie le rôle d'un membre existant */
export async function updateTeamMemberRoleAction(input: {
  organizationId: string;
  memberId: string;
  role: "manager" | "checkin_agent" | "moderator";
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!["manager", "checkin_agent", "moderator"].includes(input.role)) {
      return { ok: false, error: "Ce rôle n'est pas valide." };
    }
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Vous devez être connecté." };

    const canManage = await canManageTeam(supabase, input.organizationId, user.id);
    if (!canManage) {
      return { ok: false, error: "Non autorisé à modifier les membres de cette organisation." };
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("id, user_id, organization_id, role")
      .eq("id", input.memberId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();

    if (memberError || !member) {
      return { ok: false, error: "Membre introuvable." };
    }
    if (member.role === "owner") {
      return { ok: false, error: "Le rôle du propriétaire ne peut pas être modifié ici." };
    }

    const { data: updated, error } = await supabase
      .from("organization_members")
      .update({ role: input.role })
      .eq("id", input.memberId)
      .eq("organization_id", input.organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!updated) return { ok: false, error: "Le membre n'existe plus dans cette équipe." };

    // Notification in-app au membre concerné
    if (member.user_id) {
      try {
        const adminClient = createSupabaseAdminClient();
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", input.organizationId)
          .single();

        const roleLabel = ORG_ROLE_LABELS[input.role] ?? input.role;

        await adminClient.from("notifications").insert({
          user_id: member.user_id,
          type: "new_member",
          title: `Rôle mis à jour · ${org?.name ?? "Organisation"}`,
          body: `Votre rôle a été modifié en : ${roleLabel}.`,
          url: input.role === "checkin_agent" ? "/org/check-in" : "/org",
          actor_id: user.id,
          is_read: false,
        });
      } catch (e) {
        console.warn("[updateTeamMemberRoleAction] Notification error:", e);
      }
    }

    revalidatePath("/org/equipe");
    revalidatePath("/org");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur lors de la modification du rôle." };
  }
}

/** Retire un membre de l'équipe */
export async function removeTeamMemberAction(input: {
  organizationId: string;
  memberId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Vous devez être connecté." };

    const canManage = await canManageTeam(supabase, input.organizationId, user.id);
    if (!canManage) {
      return { ok: false, error: "Non autorisé à retirer ce collaborateur." };
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("id, user_id, role")
      .eq("id", input.memberId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();

    if (memberError || !member) return { ok: false, error: "Membre introuvable." };
    if (member.role === "owner") {
      return { ok: false, error: "Le propriétaire ne peut pas être révoqué de cette façon." };
    }

    const { data: removed, error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", input.memberId)
      .eq("organization_id", input.organizationId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!removed) return { ok: false, error: "Le membre n'existe plus dans cette équipe." };

    revalidatePath("/org/equipe");
    revalidatePath("/org");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur lors du retrait du collaborateur." };
  }
}
