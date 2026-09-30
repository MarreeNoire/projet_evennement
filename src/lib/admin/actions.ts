"use server";

import { revalidatePath } from "next/cache";

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
