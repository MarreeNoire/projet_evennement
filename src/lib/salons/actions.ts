"use server";

/** Mutations pour le salon communautaire (poster, commenter, réagir, join/leave). */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReactionType } from "@/types/database";

const NOT_SIGNED_IN = "Connecte-toi pour participer.";

/** Identifiant de l'utilisateur connecté (les politiques RLS exigent author_id / user_id = auth.uid()). */
async function getUserId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Crée une publication dans un salon.
 * La contrainte RLS posts_insert vérifie que l'auteur a accès au salon.
 */
export async function createPost(
  salonId: string,
  content: string,
  media: { url: string; kind: "image" | "video"; thumbnail_url?: string | null }[] = []
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      salon_id: salonId,
      author_id: userId,
      content: content.trim(),
      media: media as any,
      kind: "post" as const,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, postId: data.id };
}

/**
 * Crée un commentaire (ou réponse à un commentaire).
 * parent_id = null → réponse à un post ; parent_id = commentaire → réponse.
 */
export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: userId,
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, commentId: data.id };
}

/**
 * Réagit à un post ou commentaire.
 * Toggle : si l'utilisateur a déjà réagi, on supprime (ou change selon le type).
 */
export async function toggleReaction(
  target: "post" | "comment",
  targetId: string,
  reaction: ReactionType
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  // Ma réaction uniquement : la policy de lecture expose toutes celles du salon.
  const { data: existing, error: fetchError } = await supabase
    .from("reactions")
    .select("id, reaction")
    .eq(target === "post" ? "post_id" : "comment_id", targetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (existing) {
    if (existing.reaction === reaction) {
      // Même réaction → suppression
      const { error: deleteError } = await supabase
        .from("reactions")
        .delete()
        .eq("id", existing.id);
      if (deleteError) return { success: false, error: deleteError.message };
    } else {
      // Changer le type de réaction
      const { error: updateError } = await supabase
        .from("reactions")
        .update({ reaction })
        .eq("id", existing.id);
      if (updateError) return { success: false, error: updateError.message };
    }
  } else {
    // Nouvelle réaction
    const payload: any = {
      user_id: userId,
      [target === "post" ? "post_id" : "comment_id"]: targetId,
      reaction,
    };
    const { error: insertError } = await supabase.from("reactions").insert(payload);
    if (insertError) return { success: false, error: insertError.message };
  }

  return { success: true };
}

/**
 * Met à jour last_read_at du membre dans le salon → marque comme lu.
 */
export async function markSalonRead(salonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("salon_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("salon_id", salonId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Met en sourdine un salon (stop des notifications).
 */
export async function muteSalon(salonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("salon_members")
    .update({ is_muted: true })
    .eq("salon_id", salonId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Quitte un salon (left_at = now).
 */
export async function leaveSalon(salonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("salon_members")
    .update({ left_at: new Date().toISOString() })
    .eq("salon_id", salonId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Rejoint un salon (crée une entrée dans salon_members si elle n'existe pas).
 * Si l'utilisateur avait quitté le salon auparavant, on rétablit son adhésion.
 */
export async function joinSalon(salonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  // Récupérer l'utilisateur actuel de façon sûre
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: authError?.message ?? "Utilisateur non authentifié" };
  }
  const userId = user.id;

  // Vérifier d'abord si une adhésion existe déjà
  const { data: existingMember, error: fetchError } = await supabase
    .from("salon_members")
    .select("id, left_at, role")
    .eq("salon_id", salonId)
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = "Row not found"
    return { success: false, error: fetchError.message };
  }

  if (existingMember) {
    // L'utilisateur était déjà membre, on vérifie s'il avait quitté
    if (existingMember.left_at) {
      // Il avait quitté, on rétablit l'adhésion (on remet left_at à null)
      const { error: updateError } = await supabase
        .from("salon_members")
        .update({ left_at: null })
        .eq("id", existingMember.id);

      if (updateError) return { success: false, error: updateError.message };
    }
    // Sinon, il était déjà actif, rien à faire
  } else {
    // Nouvelle adhésion
    // Utiliser le rôle par défaut 'manager' (selon la définition de la table)
    const { error: insertError } = await supabase
      .from("salon_members")
      .insert({
        salon_id: salonId,
        user_id: userId,
        role: "manager",
        joined_at: new Date().toISOString(),
      });

    if (insertError) return { success: false, error: insertError.message };
  }

  return { success: true };
}
