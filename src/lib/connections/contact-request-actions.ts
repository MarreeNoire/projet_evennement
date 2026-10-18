"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ContactRequestResult = { success: true } | { success: false; error: string };

export async function requestConnectionPhone(connectionId: string): Promise<ContactRequestResult> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { success: false, error: "Connecte-toi pour continuer." };

  const { data: connection, error: connectionError } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id")
    .eq("id", connectionId)
    .eq("status", "accepted")
    .maybeSingle();
  if (connectionError || !connection) {
    return { success: false, error: "Cette connexion n’est plus disponible." };
  }

  const requesterId = authData.user.id;
  const recipientId =
    connection.requester_id === requesterId
      ? connection.addressee_id
      : connection.addressee_id === requesterId
        ? connection.requester_id
        : null;
  if (!recipientId)
    return { success: false, error: "Cette personne n’est pas dans tes connexions." };

  const { data: existingShare } = await supabase
    .from("profile_contacts")
    .select("user_id")
    .eq("user_id", recipientId)
    .maybeSingle();
  if (existingShare)
    return { success: false, error: "Cette personne a déjà partagé son numéro avec toi." };

  const { error } = await supabase.from("connection_contact_requests").insert({
    connection_id: connectionId,
    requester_id: requesterId,
    recipient_id: recipientId,
  });
  if (error?.code === "23505") {
    return {
      success: false,
      error: "Une demande de numéro est déjà en attente pour cette connexion.",
    };
  }
  if (error) return { success: false, error: "La demande n’a pas pu être envoyée. Réessaie." };

  revalidatePath("/connexions");
  revalidatePath("/notifications");
  return { success: true };
}

export async function respondToConnectionPhoneRequest(
  requestId: string,
  accept: boolean,
): Promise<ContactRequestResult> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { success: false, error: "Connecte-toi pour continuer." };

  if (accept) {
    const { data: contact, error: contactError } = await supabase
      .from("profile_contacts")
      .select("phone")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (contactError || !contact?.phone) {
      return {
        success: false,
        error: "Ajoute d’abord ton numéro dans Mon profil avant d’accepter cette demande.",
      };
    }
  }

  const { error } = await supabase
    .from("connection_contact_requests")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("recipient_id", authData.user.id)
    .eq("status", "pending");
  if (error) return { success: false, error: "La réponse n’a pas pu être enregistrée. Réessaie." };

  revalidatePath("/connexions");
  revalidatePath("/notifications");
  return { success: true };
}
