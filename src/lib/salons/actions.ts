"use server";

import { revalidatePath } from "next/cache";

/** Mutations pour le salon communautaire (poster, commenter, réagir, join/leave). */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  OrgRole,
  PostKind,
  ReactionType,
  ReportReason,
  ReportTarget,
  SalonPostCategory,
} from "@/types/database";

const NOT_SIGNED_IN = "Connecte-toi pour participer.";
const MAX_COMMENTS = 2000;
/** Rôles considérés comme « organisateur » dans un salon (usage interne). */
const ORGANIZER_ROLES: OrgRole[] = ["owner", "moderator"];
const SALON_CHAT_REACTIONS = ["heart", "laugh", "fire", "clap", "wow"] as const;
type SalonChatReaction = (typeof SALON_CHAT_REACTIONS)[number];

/** Identifiant de l'utilisateur connecté (les politiques RLS exigent author_id / user_id = auth.uid()). */
async function getUserId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Rôle de l'utilisateur courant dans un salon (owner, moderator, manager…). */
async function getSalonRole(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  salonId: string,
  userId: string,
): Promise<OrgRole | null> {
  const { data } = await supabase
    .from("salon_members")
    .select("role")
    .eq("salon_id", salonId)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();
  return (data?.role as OrgRole | null) ?? null;
}

/** Envoie un message dans le chat instantané du salon. */
export async function sendSalonChatMessage(
  salonId: string,
  content: string,
  replyTo?: string | null,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const normalized = content.trim();
  if (!normalized || normalized.length > 4000) {
    return { success: false, error: "Le message doit contenir entre 1 et 4 000 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("salon_chat_messages")
    .insert({
      salon_id: salonId,
      author_id: userId,
      content: normalized,
      reply_to: replyTo || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Le message n'a pas pu être envoyé. Réessaie." };
  return { success: true, messageId: data.id };
}

/** Modifie un message appartenant à l'utilisateur courant. */
export async function editSalonChatMessage(
  messageId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const normalized = content.trim();
  if (!normalized || normalized.length > 4000) {
    return { success: false, error: "Le message doit contenir entre 1 et 4 000 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("salon_chat_messages")
    .update({ content: normalized, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: "La modification du message a échoué." };
  if (!data) return { success: false, error: "Ce message ne peut plus être modifié." };
  return { success: true };
}

/** Supprime un message appartenant à l'utilisateur courant. */
export async function deleteSalonChatMessage(
  messageId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("salon_chat_messages")
    .delete()
    .eq("id", messageId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: "La suppression du message a échoué." };
  if (!data) return { success: false, error: "Ce message ne peut plus être supprimé." };
  return { success: true };
}

/** Ajoute ou retire une réaction rapide sur un message du chat. */
export async function toggleSalonChatReaction(
  salonId: string,
  messageId: string,
  reaction: SalonChatReaction,
): Promise<{ success: boolean; error?: string }> {
  if (!SALON_CHAT_REACTIONS.includes(reaction)) {
    return { success: false, error: "Cette réaction n'est pas disponible." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: existing, error: readError } = await supabase
    .from("salon_chat_reactions")
    .select("id")
    .eq("salon_id", salonId)
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("reaction", reaction)
    .maybeSingle();

  if (readError) return { success: false, error: "La réaction n'a pas pu être enregistrée." };

  const result = existing
    ? await supabase.from("salon_chat_reactions").delete().eq("id", existing.id)
    : await supabase.from("salon_chat_reactions").insert({
        salon_id: salonId,
        message_id: messageId,
        user_id: userId,
        reaction,
      });

  if (result.error) return { success: false, error: "La réaction n'a pas pu être enregistrée." };
  return { success: true };
}

/** Nombre minimal et maximal d'options d'un sondage. */
const POLL_MIN_OPTIONS = 2;
const POLL_MAX_OPTIONS = 6;

/**
 * Crée un sondage dans un salon : une question et 2 à 6 options.
 * Les options sont insérées dans la même transaction logique (insert puis options).
 * @deprecated Utiliser la version plus complète ci-dessous (createSalonPoll avec validation UUID).
 */
async function _createSalonPollLegacy(
  salonId: string,
  question: string,
  options: string[],
): Promise<{ success: boolean; pollId?: string; error?: string }> {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion || normalizedQuestion.length > 280) {
    return { success: false, error: "La question doit contenir entre 1 et 280 caractères." };
  }

  const normalizedOptions = options.map((option) => option.trim()).filter(Boolean);
  if (normalizedOptions.length < POLL_MIN_OPTIONS || normalizedOptions.length > POLL_MAX_OPTIONS) {
    return {
      success: false,
      error: `Un sondage compte entre ${POLL_MIN_OPTIONS} et ${POLL_MAX_OPTIONS} options.`,
    };
  }
  if (normalizedOptions.some((option) => option.length > 120)) {
    return { success: false, error: "Chaque option fait au maximum 120 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: poll, error: pollError } = await supabase
    .from("salon_polls")
    .insert({ salon_id: salonId, author_id: userId, question: normalizedQuestion })
    .select("id")
    .single();

  if (pollError || !poll) {
    return { success: false, error: "Le sondage n'a pas pu être créé. Réessaie." };
  }

  const { error: optionsError } = await supabase.from("salon_poll_options").insert(
    normalizedOptions.map((label, index) => ({
      poll_id: poll.id,
      label,
      position: index,
    })),
  );

  if (optionsError) {
    await supabase.from("salon_polls").delete().eq("id", poll.id);
    return { success: false, error: "Le sondage n'a pas pu être créé. Réessaie." };
  }

  return { success: true, pollId: poll.id };
}

/**
 * Vote (ou change de vote) sur un sondage ouvert du salon.
 * La politique RLS vérifie l'accès au salon, l'option et l'état du sondage.
 * @deprecated Utiliser voteSalonPoll avec validation UUID ci-dessous.
 */
async function _voteSalonPollLegacy(
  pollId: string,
  optionId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: existing, error: readError } = await supabase
    .from("salon_poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) return { success: false, error: "Le vote n'a pas pu être enregistré." };

  const result = existing
    ? await supabase.from("salon_poll_votes").update({ option_id: optionId }).eq("id", existing.id)
    : await supabase.from("salon_poll_votes").insert({ poll_id: pollId, option_id: optionId, user_id: userId });

  if (result.error) {
    return { success: false, error: "Le vote n'a pas pu être enregistré. Réessaie." };
  }
  return { success: true };
}

/** Retire le vote de l'utilisateur courant sur un sondage ouvert. */
export async function retractSalonPollVote(
  pollId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("salon_poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  if (error) return { success: false, error: "Le vote n'a pas pu être retiré." };
  return { success: true };
}

/** Clôt un sondage : l'auteur ou un modérateur du salon.
 * @deprecated Utiliser closeSalonPoll avec validation UUID ci-dessous.
 */
async function _closeSalonPollLegacy(
  pollId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("salon_polls")
    .update({ is_closed: true, closed_at: new Date().toISOString() })
    .eq("id", pollId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "Seul l'auteur du sondage ou un modérateur peut le clôturer." };
  }
  return { success: true };
}

/** Supprime un sondage : l'auteur ou un modérateur du salon.
 * @deprecated Utiliser deleteSalonPoll avec validation UUID ci-dessous si créé.
 */
async function _deleteSalonPollLegacy(
  pollId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("salon_polls")
    .delete()
    .eq("id", pollId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "Seul l'auteur du sondage ou un modérateur peut le supprimer." };
  }
  return { success: true };
}

/**
 * Crée une publication dans un salon.
 * La contrainte RLS posts_insert vérifie que l'auteur a accès au salon.
 */
export async function createPost(
  salonId: string,
  content: string,
  media: { storage_path: string; size_bytes: number }[] = [],
  category: SalonPostCategory = "discussion",
  options: { kind?: PostKind } = {},
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  if (media.length > 4 || media.some((item) => !item.storage_path.startsWith(`${salonId}/`))) {
    return { success: false, error: "Les photos sélectionnées ne sont pas valides." };
  }
  const categories: SalonPostCategory[] = [
    "discussion",
    "question",
    "info_pratique",
    "rencontre",
    "covoiturage",
    "photo",
  ];
  if (!categories.includes(category))
    return { success: false, error: "Cette étiquette n’est pas valide." };

  const kind: PostKind = options.kind === "announcement" ? "announcement" : "post";
  if (kind === "announcement") {
    const userIdForRole = await getUserId(supabase);
    if (!userIdForRole) return { success: false, error: NOT_SIGNED_IN };
    const role = await getSalonRole(supabase, salonId, userIdForRole);
    if (!role || !ORGANIZER_ROLES.includes(role)) {
      return { success: false, error: "Seuls les organisateurs peuvent publier une annonce." };
    }
  }

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("event_id")
    .eq("id", salonId)
    .single();
  if (salonError || !salon) return { success: false, error: "Ce salon est introuvable." };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      salon_id: salonId,
      author_id: userId,
      content: content.trim(),
      media: [],
      kind,
      category,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (media.length > 0) {
    const { error: mediaError } = await supabase.from("media").insert(
      media.map((item) => ({
        salon_id: salonId,
        event_id: salon.event_id,
        post_id: data.id,
        uploader_id: userId,
        kind: "image" as const,
        storage_path: item.storage_path,
        url: item.storage_path,
        size_bytes: item.size_bytes,
      })),
    );
    if (mediaError) {
      await supabase.from("posts").delete().eq("id", data.id);
      return {
        success: false,
        error: mediaError.message.includes("row-level security")
          ? "L’envoi de photos est désactivé pour cet événement."
          : "Le message est prêt, mais les photos n’ont pas pu être enregistrées.",
      };
    }
  }
  return { success: true, postId: data.id };
}

/** Modifie le texte d'une publication appartenant à l'utilisateur courant. */
export async function updateSalonPost(
  postId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const normalized = content.trim();
  if (!normalized || normalized.length > 5000) {
    return { success: false, error: "La publication doit contenir entre 1 et 5 000 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("posts")
    .update({ content: normalized, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", userId)
    .select("salon_id")
    .maybeSingle();

  if (error) return { success: false, error: "La modification n'a pas pu être enregistrée." };
  if (!data) return { success: false, error: "Cette publication ne peut plus être modifiée." };

  revalidatePath(`/salons/${data.salon_id}`);
  return { success: true };
}

/**
 * Crée un commentaire (ou réponse à un commentaire).
 * parent_id = null → réponse à un post ; parent_id = commentaire → réponse.
 */
export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
  mentions: string[] = [],
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  const normalized = content.trim();
  if (!normalized || normalized.length > MAX_COMMENTS) {
    return { success: false, error: "Le commentaire doit contenir entre 1 et 2 000 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("comments")
      .select("id")
      .eq("id", parentId)
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .maybeSingle();
    if (parentError || !parent) {
      return { success: false, error: "Ce commentaire ne peut pas recevoir de réponse." };
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: userId,
      content: normalized,
      parent_id: parentId ?? null,
      mentions,
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
  reaction: ReactionType,
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
export async function markSalonRead(
  salonId: string,
): Promise<{ success: boolean; error?: string }> {
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
    const { error: insertError } = await supabase.from("salon_members").insert({
      salon_id: salonId,
      user_id: userId,
      role: "manager",
      joined_at: new Date().toISOString(),
    });

    if (insertError) return { success: false, error: insertError.message };
  }

  return { success: true };
}

/** Crée un sondage et ses choix dans un salon accessible à l'utilisateur. */
export async function createSalonPoll(
  salonId: string,
  question: string,
  rawOptions: string[],
): Promise<{ success: boolean; error?: string }> {
  const normalizedQuestion = question.trim();
  const options = rawOptions.map((option) => option.trim());
  if (!/^[0-9a-f-]{36}$/i.test(salonId)) {
    return { success: false, error: "Ce salon est invalide." };
  }
  if (normalizedQuestion.length < 1 || normalizedQuestion.length > 280) {
    return { success: false, error: "La question doit contenir au maximum 280 caractères." };
  }
  if (
    options.length < 2 ||
    options.length > 6 ||
    options.some((option) => !option || option.length > 120) ||
    new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length
  ) {
    return { success: false, error: "Ajoute 2 à 6 choix distincts, de 120 caractères maximum." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: poll, error: pollError } = await supabase
    .from("salon_polls")
    .insert({ salon_id: salonId, author_id: userId, question: normalizedQuestion })
    .select("id")
    .single();
  if (pollError || !poll) {
    return { success: false, error: "Impossible de créer le sondage dans ce salon." };
  }

  const { error: optionsError } = await supabase
    .from("salon_poll_options")
    .insert(options.map((label, position) => ({ poll_id: poll.id, label, position })));
  if (optionsError) {
    await supabase.from("salon_polls").delete().eq("id", poll.id);
    return { success: false, error: "Les choix n’ont pas pu être enregistrés. Réessaie." };
  }

  revalidatePath(`/salons/${salonId}`);
  return { success: true };
}

/** Enregistre ou modifie le choix de l'utilisateur tant que le sondage est ouvert. */
export async function voteSalonPoll(
  pollId: string,
  optionId: string,
): Promise<{ success: boolean; error?: string }> {
  if (![pollId, optionId].every((value) => /^[0-9a-f-]{36}$/i.test(value))) {
    return { success: false, error: "Ce choix de vote est invalide." };
  }
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: poll, error: pollError } = await supabase
    .from("salon_polls")
    .select("salon_id, is_closed")
    .eq("id", pollId)
    .maybeSingle();
  if (pollError || !poll || poll.is_closed) {
    return { success: false, error: "Ce sondage est fermé ou indisponible." };
  }

  const { error } = await supabase
    .from("salon_poll_votes")
    .upsert(
      { poll_id: pollId, option_id: optionId, user_id: userId },
      { onConflict: "poll_id,user_id" },
    );
  if (error) return { success: false, error: "Ton vote n’a pas pu être enregistré. Réessaie." };

  revalidatePath(`/salons/${poll.salon_id}`);
  return { success: true };
}

/** Clôture définitivement un sondage (auteur ou modérateur selon les règles RLS). */
export async function closeSalonPoll(
  pollId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(pollId)) {
    return { success: false, error: "Ce sondage est invalide." };
  }
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: poll, error: readError } = await supabase
    .from("salon_polls")
    .select("salon_id, is_closed")
    .eq("id", pollId)
    .maybeSingle();
  if (readError || !poll) return { success: false, error: "Ce sondage est introuvable." };
  if (poll.is_closed) return { success: true };

  const { data, error } = await supabase
    .from("salon_polls")
    .update({ is_closed: true, closed_at: new Date().toISOString() })
    .eq("id", pollId)
    .eq("is_closed", false)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return {
      success: false,
      error: "Seuls l’auteur ou un modérateur peuvent clôturer ce sondage.",
    };
  }

  revalidatePath(`/salons/${poll.salon_id}`);
  return { success: true };
}

/* -----------------------------------------------------------------------------
   Refonte des salons — actions additives (aucune action existante modifiée)
   Les politiques RLS font foi ; les vérifications de rôle ici limitent les
   allers-retours, jamais la sécurité.
   -------------------------------------------------------------------------- */

/** Modifie un commentaire appartenant à l'utilisateur courant. */
export async function updateComment(
  commentId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const normalized = content.trim();
  if (!normalized || normalized.length > MAX_COMMENTS) {
    return { success: false, error: "Le commentaire doit contenir entre 1 et 2 000 caractères." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("comments")
    .update({ content: normalized, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", userId)
    .select("post_id")
    .maybeSingle();

  if (error) return { success: false, error: "La modification n’a pas pu être enregistrée." };
  if (!data) return { success: false, error: "Ce commentaire ne peut plus être modifié." };

  if (data.post_id) {
    const { data: post } = await supabase
      .from("posts")
      .select("salon_id")
      .eq("id", data.post_id)
      .maybeSingle();
    if (post) revalidatePath(`/salons/${post.salon_id}`);
  }
  return { success: true };
}

/** Supprime un commentaire appartenant à l'utilisateur courant. */
export async function deleteComment(
  commentId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", userId);

  if (error) return { success: false, error: "Ce commentaire ne peut pas être supprimé." };
  return { success: true };
}

/** Masque (ou réaffiche) un commentaire — organisateurs du salon. */
export async function setCommentHidden(
  salonId: string,
  commentId: string,
  hidden: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const role = await getSalonRole(supabase, salonId, userId);
  if (!role || !ORGANIZER_ROLES.includes(role)) {
    return { success: false, error: "Seuls les organisateurs peuvent modérer les commentaires." };
  }

  const { error } = await supabase
    .from("comments")
    .update({ is_hidden: hidden, hidden_by: hidden ? userId : null })
    .eq("id", commentId);

  if (error) return { success: false, error: "Cette modération n’a pas pu être appliquée." };

  revalidatePath(`/salons/${salonId}`);
  return { success: true };
}

/** Masque (ou réaffiche) une publication — organisateurs du salon. */
export async function setPostHidden(
  postId: string,
  hidden: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: post } = await supabase
    .from("posts")
    .select("salon_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { success: false, error: "Cette publication est introuvable." };

  const role = await getSalonRole(supabase, post.salon_id, userId);
  if (!role || !ORGANIZER_ROLES.includes(role)) {
    return { success: false, error: "Seuls les organisateurs peuvent masquer une publication." };
  }

  const { error } = await supabase
    .from("posts")
    .update({ is_hidden: hidden, hidden_by: hidden ? userId : null })
    .eq("id", postId);

  if (error) return { success: false, error: "Cette modération n’a pas pu être appliquée." };

  revalidatePath(`/salons/${post.salon_id}`);
  return { success: true };
}

/** Épingle (ou désépingle) une publication — organisateurs du salon. */
export async function setPostPinned(
  postId: string,
  pinned: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: post } = await supabase
    .from("posts")
    .select("salon_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { success: false, error: "Cette publication est introuvable." };

  const role = await getSalonRole(supabase, post.salon_id, userId);
  if (!role || !ORGANIZER_ROLES.includes(role)) {
    return { success: false, error: "Seuls les organisateurs peuvent épingler une publication." };
  }

  const { error } = await supabase
    .from("posts")
    .update({ is_pinned: pinned })
    .eq("id", postId);

  if (error) return { success: false, error: "L’épinglage n’a pas pu être appliqué." };

  revalidatePath(`/salons/${post.salon_id}`);
  return { success: true };
}

/** Supprime une publication (son auteur, ou un organisateur si la RLS l’autorise). */
export async function deleteSalonPost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { data: deleted } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId)
    .select("salon_id")
    .maybeSingle();

  if (deleted) {
    revalidatePath(`/salons/${deleted.salon_id}`);
    return { success: true };
  }

  /* L'auteur ne peut pas supprimer : tente la voie organisateur (policy RLS). */
  const { data: post } = await supabase
    .from("posts")
    .select("salon_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { success: false, error: "Cette publication est introuvable." };

  const role = await getSalonRole(supabase, post.salon_id, userId);
  if (role && ORGANIZER_ROLES.includes(role)) {
    const { error: orgDeleteError } = await supabase.from("posts").delete().eq("id", postId);
    if (!orgDeleteError) {
      revalidatePath(`/salons/${post.salon_id}`);
      return { success: true };
    }
  }

  return { success: false, error: "Cette publication ne peut pas être supprimée." };
}

/**
 * Marque le salon comme lu pour le membre courant UNIQUEMENT.
 * (Correctif : `markSalonRead` historique met à jour last_read_at de tous les
 * membres ; cette version est restreinte à la ligne du membre connecté.)
 */
export async function markSalonReadForMember(
  salonId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("salon_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("salon_id", salonId)
    .eq("user_id", userId)
    .is("left_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Active ou désactive les notifications du salon pour le membre courant. */
export async function setSalonMuted(
  salonId: string,
  muted: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { error } = await supabase
    .from("salon_members")
    .update({ is_muted: muted })
    .eq("salon_id", salonId)
    .eq("user_id", userId)
    .is("left_at", null);

  if (error) return { success: false, error: "Les notifications n’ont pas pu être modifiées." };
  return { success: true };
}

/** Signale une publication, un commentaire ou un utilisateur du salon. */
export async function reportSalonTarget(
  target: {
    type: ReportTarget;
    id: string;
    salonId: string;
  },
  reason: ReportReason,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(target.id) || !/^[0-9a-f-]{36}$/i.test(target.salonId)) {
    return { success: false, error: "Signalement invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getUserId(supabase);
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    target_type: target.type,
    target_id: target.id,
    salon_id: target.salonId,
    reason,
    details: details?.trim() || null,
    status: "open" as const,
  });

  if (error) return { success: false, error: "Le signalement n’a pas pu être envoyé. Réessaie." };
  return { success: true };
}
