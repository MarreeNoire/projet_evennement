"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Envoie une demande de connexion. Refusée par la policy RLS si le destinataire n'accepte pas les connexions ou a bloqué l'expéditeur. */
export async function requestConnection(
  addresseeId: string,
  options: { eventId?: string; origin?: string } = {},
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Connecte-toi pour te connecter à d'autres participants." };
  if (user.id === addresseeId) return { success: false, error: "Impossible de se connecter à soi-même." };

  const { error } = await supabase.from("connections").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    origin: options.origin ?? "profile",
    event_id: options.eventId ?? null,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "Une demande existe déjà." };
    return { success: false, error: error.message };
  }

  revalidatePath(`/profil/${addresseeId}`);
  return { success: true };
}

/** Accepte ou refuse une demande de connexion reçue. Seul le destinataire peut répondre. */
export async function respondToConnection(
  connectionId: string,
  accept: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Connecte-toi pour répondre." };

  const { error } = await supabase
    .from("connections")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };

  revalidatePath("/connexions");
  return { success: true };
}
