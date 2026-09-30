"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.roles.includes("admin")) throw new Error("Accès réservé aux administrateurs.");
  return profile;
}

export async function savePlatformCommissionAction(percent: number) {
  const profile = await requireAdmin();
  if (!Number.isFinite(percent) || percent < 0 || percent > 50) {
    return { error: "Le taux doit être compris entre 0 % et 50 %." };
  }

  const supabase = await createSupabaseServerClient();
  const rate = Number((percent / 100).toFixed(4));
  const { error } = await supabase.from("platform_settings").upsert({
    key: "platform.commission_rate",
    value: rate,
    description: "Commission prélevée sur chaque commande.",
    // Le taux n'est pas confidentiel et doit être lisible pendant le checkout.
    is_public: true,
    updated_by: profile.id,
  });
  if (error) return { error: "Impossible d'enregistrer le taux. Vérifiez vos droits et réessayez." };

  const { error: auditError } = await supabase.rpc("log_audit", {
    p_action: "platform.commission.update",
    p_entity_type: "platform_setting",
    p_entity_id: null as unknown as string,
    p_after: { key: "platform.commission_rate", rate },
  });
  revalidatePath("/admin/parametres");
  return {
    success: auditError
      ? `Commission enregistrée à ${percent} %, mais l'écriture du journal a échoué.`
      : `Commission enregistrée à ${percent} %.`,
  };
}

export async function resolveReportAction(
  reportId: string,
  status: "resolved" | "dismissed",
  hideTarget: boolean,
) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(reportId)) return { error: "Signalement invalide." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("resolve_report", {
    p_report_id: reportId,
    p_status: status,
    p_resolution: status === "resolved" ? "Traité par l’administration." : "Signalement examiné et rejeté.",
    p_hide_target: hideTarget,
  });
  if (error) return { error: "Le signalement n'a pas pu être traité. Actualisez puis réessayez." };
  revalidatePath("/admin/moderation");
  return { success: "Signalement mis à jour." };
}

export async function updatePayoutAction(
  payoutId: string,
  nextStatus: "processing" | "paid" | "failed",
  reference = "",
) {
  const profile = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(payoutId)) return { error: "Reversement invalide." };
  const normalizedReference = reference.trim();
  if (nextStatus === "paid" && (normalizedReference.length < 3 || normalizedReference.length > 120)) {
    return { error: "Saisissez la référence de transfert pour confirmer le versement." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: payout, error: readError } = await supabase
    .from("payouts")
    .select("id, status, reference")
    .eq("id", payoutId)
    .maybeSingle();
  if (readError || !payout) return { error: "Reversement introuvable ou inaccessible." };

  const allowed: Record<string, string[]> = {
    pending: ["processing"],
    processing: ["paid", "failed"],
    failed: ["processing"],
  };
  if (!allowed[payout.status]?.includes(nextStatus)) {
    return { error: "Cette transition n'est pas autorisée. Actualisez la page." };
  }

  const update: {
    status: string;
    reference?: string;
    processed_by?: string;
    processed_at?: string;
    note?: string;
  } = { status: nextStatus };
  if (nextStatus === "paid") {
    update.reference = normalizedReference;
    update.processed_by = profile.id;
    update.processed_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from("payouts")
    .update(update)
    .eq("id", payoutId)
    .eq("status", payout.status)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) return { error: "Le reversement a changé entre-temps. Actualisez puis réessayez." };

  const { error: auditError } = await supabase.rpc("log_audit", {
    p_action: `payout.${nextStatus}`,
    p_entity_type: "payout",
    p_entity_id: payoutId,
    p_after: { status: nextStatus, reference: nextStatus === "paid" ? normalizedReference : payout.reference },
  });
  revalidatePath("/admin/paiements");
  return {
    success: auditError
      ? "Statut mis à jour, mais le journal d'audit n'a pas pu être écrit."
      : nextStatus === "paid"
        ? "Versement marqué comme effectué avec sa référence."
        : nextStatus === "failed"
          ? "Échec du versement enregistré."
          : "Reversement passé en traitement.",
  };
}

export async function setProfileVerificationAction(userId: string, verified: boolean) {
  const actor = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Utilisateur invalide." };
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("id, is_verified")
    .eq("id", userId)
    .maybeSingle();
  if (readError || !profile) return { error: "Profil introuvable ou inaccessible." };
  const { error } = await supabase.from("profiles").update({ is_verified: verified }).eq("id", userId);
  if (error) return { error: "La vérification du profil n'a pas pu être mise à jour." };

  const { error: auditError } = await supabase.rpc("log_audit", {
    p_action: verified ? "profile.verify" : "profile.unverify",
    p_entity_type: "profile",
    p_entity_id: userId,
    p_before: { is_verified: profile.is_verified },
    p_after: { is_verified: verified, by: actor.id },
  });
  revalidatePath("/admin/utilisateurs");
  return {
    success: auditError
      ? "Profil mis à jour, mais le journal d'audit n'a pas pu être écrit."
      : verified
        ? "Profil vérifié."
        : "Vérification du profil retirée.",
  };
}

/** Attribue ou retire un rôle à un utilisateur, en laissant la base protéger le dernier administrateur. */
export async function setUserRoleAction(
  userId: string,
  role: "participant" | "organizer" | "admin",
  granted: boolean,
): Promise<{ error?: string; success?: string }> {
  const actor = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Utilisateur invalide." };
  if (role === "admin" && !granted && userId === actor.id) {
    return { error: "Vous ne pouvez pas retirer votre propre accès administrateur." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
    p_grant: granted,
  });
  if (error) {
    console.error("[setUserRoleAction] Modification du rôle impossible:", error);
    if (error.message.includes("LAST_ADMIN")) {
      return { error: "Le dernier administrateur de la plateforme ne peut pas être retiré." };
    }
    if (error.message.includes("USER_NOT_FOUND")) return { error: "Cet utilisateur n’existe plus." };
    return { error: "Le rôle n’a pas pu être modifié. Actualisez la page puis réessayez." };
  }

  revalidatePath("/admin/utilisateurs");
  revalidatePath(`/admin/utilisateurs/${userId}`);
  return {
    success: granted
      ? `Le rôle ${role === "admin" ? "Administrateur" : role === "organizer" ? "Organisateur" : "Participant"} a été attribué.`
      : `Le rôle ${role === "admin" ? "Administrateur" : role === "organizer" ? "Organisateur" : "Participant"} a été retiré.`,
  };
}

/** Supprime un événement sans ventes, ou le retire de la plateforme en conservant les commandes. */
export async function deleteAdminEventAction(
  eventId: string,
): Promise<{ error?: string; success?: string; warning?: string }> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return { error: "Événement invalide." };

  const admin = createSupabaseAdminClient();
  const [{ data: event, error: eventError }, { count: orderCount, error: ordersError }] = await Promise.all([
    admin.from("events").select("id, title, slug, status").eq("id", eventId).maybeSingle(),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("event_id", eventId),
  ]);

  if (eventError || !event) return { error: "Événement introuvable." };
  if (ordersError) return { error: "Impossible de vérifier les ventes de cet événement." };

  const supabase = await createSupabaseServerClient();
  const hasOrders = (orderCount ?? 0) > 0;
  if (hasOrders) {
    const { error } = await admin
      .from("events")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "Événement retiré par l’administration.",
      })
      .eq("id", eventId);
    if (error) return { error: "L’événement n’a pas pu être retiré de la plateforme." };
  } else {
    const { error } = await admin.from("events").delete().eq("id", eventId);
    if (error) {
      console.error("[deleteAdminEventAction] Suppression refusée:", error);
      return { error: "L’événement n’a pas pu être supprimé. Vérifiez qu’aucune donnée liée ne bloque l’opération." };
    }
  }

  const { error: auditError } = await supabase.rpc("log_audit", {
    p_action: hasOrders ? "event.remove" : "event.delete",
    p_entity_type: "event",
    p_entity_id: eventId,
    p_event_id: hasOrders ? eventId : null,
    p_before: { title: event.title, status: event.status, orders: orderCount ?? 0 },
    p_after: hasOrders ? { status: "cancelled", removed_by_admin: true } : { deleted: true },
  });

  revalidatePath("/admin/evenements");
  revalidatePath("/explorer");
  revalidatePath("/");
  revalidatePath(`/evenements/${event.slug}`);
  return {
    success: hasOrders
      ? "Événement retiré de la plateforme. Les commandes et les billets sont conservés."
      : "Événement supprimé.",
    warning: auditError ? "Le journal d’audit n’a pas pu être mis à jour." : undefined,
  };
}

/** Bloque un compte dans Supabase Auth ou lui rend l'accès. */
export async function setUserBanAction(
  userId: string,
  banned: boolean,
): Promise<{ error?: string; success?: string }> {
  const actor = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Utilisateur invalide." };
  if (banned && userId === actor.id) return { error: "Vous ne pouvez pas bannir votre propre compte." };

  const admin = createSupabaseAdminClient();
  const [{ data: target, error: userError }, { data: targetRoles, error: rolesError }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (userError || !target.user) return { error: "Utilisateur introuvable dans les comptes de la plateforme." };
  if (rolesError) return { error: "Impossible de vérifier les rôles de cet utilisateur." };
  if (banned && targetRoles?.some((role) => role.role === "admin")) {
    return { error: "Un compte administrateur ne peut pas être banni depuis cette action." };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none",
  });
  if (error) {
    console.error("[setUserBanAction] Mise à jour du bannissement impossible:", error);
    return { error: "Le statut de bannissement n’a pas pu être mis à jour." };
  }

  const supabase = await createSupabaseServerClient();
  const { error: auditError } = await supabase.rpc("log_audit", {
    p_action: banned ? "user.ban" : "user.unban",
    p_entity_type: "user",
    p_entity_id: userId,
    p_before: { banned: Boolean(target.user.banned_until && Date.parse(target.user.banned_until) > Date.now()) },
    p_after: { banned, by: actor.id },
  });

  revalidatePath("/admin/utilisateurs");
  revalidatePath(`/admin/utilisateurs/${userId}`);
  return {
    success: auditError
      ? "Statut du compte mis à jour, mais le journal d’audit n’a pas pu être écrit."
      : banned
        ? "Compte banni. L’utilisateur ne peut plus ouvrir de nouvelle session."
        : "Bannissement retiré. L’utilisateur peut se reconnecter.",
  };
}
