"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreateEventDraftTicketInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  accessLevel?: "standard" | "vip" | "vvip";
}

export interface CreateEventDraftInput {
  title: string;
  category: string;
  city: string;
  venueName?: string;
  description?: string;
  startAt: string;
  endAt?: string;
  /** URL publique de l'image de couverture (bucket `event-covers`). */
  coverUrl?: string;
  /** URL publiques des images de galerie (bucket `event-covers`). */
  galleryUrls?: string[];
  tickets?: CreateEventDraftTicketInput[];
}

/** N'accepte que des URL https publiques : jamais de javascript: ni de data:. */
function sanitizeCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https:\/\/\S+$/.test(trimmed) ? trimmed : null;
}

/** Filtre une liste d'URL https publiques (couverture + galerie). */
function sanitizeGalleryUrls(urls: string[] | null | undefined): string[] {
  if (!urls) return [];
  const clean = urls
    .map((url) => sanitizeCoverUrl(url))
    .filter((url): url is string => url !== null);
  // 6 images maximum, sans doublons.
  return [...new Set(clean)].slice(0, 6);
}

export interface CreateEventDraftResult {
  ok: boolean;
  eventId?: string;
  slug?: string;
  error?: string;
}

/**
 * Action serveur pour enregistrer un nouvel événement en tant que brouillon.
 */
export async function saveEventDraftAction(
  input: CreateEventDraftInput,
): Promise<CreateEventDraftResult> {
  if (!input.title || !input.title.trim()) {
    return { ok: false, error: "Le titre de l'événement est obligatoire." };
  }

  if (!input.startAt) {
    return { ok: false, error: "La date et l'heure de début sont obligatoires." };
  }

  for (const [index, ticket] of (input.tickets ?? []).entries()) {
    if (!Number.isFinite(ticket.price) || ticket.price < 0) {
      return { ok: false, error: `Le prix de la formule n°${index + 1} doit être un nombre positif ou nul.` };
    }
    if (!Number.isInteger(ticket.quantity) || ticket.quantity < 1) {
      return { ok: false, error: `Le quota de la formule n°${index + 1} doit être un entier supérieur à 0.` };
    }
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté pour enregistrer un brouillon." };
    }

    // 1. Rechercher l'organisation de l'utilisateur
    //    `maybeSingle()` renvoie une erreur dès qu'il existe PLUSIEURS lignes :
    //    on limite donc explicitement à une ligne (un organisateur peut posséder
    //    plusieurs organisations, l'historique de l'app en a créé plusieurs).
    let orgId: string | null = null;

    const { data: ownedOrgs } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    const ownedOrg = ownedOrgs?.[0];

    if (ownedOrg) {
      orgId = ownedOrg.id;
    } else {
      const { data: memberOrgs } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1);

      const memberOrg = memberOrgs?.[0];

      if (memberOrg) {
        orgId = memberOrg.organization_id;
      }
    }

    // 2. Si aucune organisation n'existe encore, la créer via la fonction dédiée
    //    `become_organizer` (security definer) : elle crée l'organisation ET
    //    attribue le rôle `organizer`, ce qu'un insert direct ne peut pas faire
    //    (cf. 0021 : seule la RLS admin autorise l'écriture sur `user_roles`).
    if (!orgId) {
      const orgName = `Organisation ${user.email || "Mon Organisation"}`;

      const { data: rpcOrg, error: rpcError } = await supabase.rpc("become_organizer", {
        p_org_name: orgName,
      });

      if (!rpcError && rpcOrg) {
        orgId = rpcOrg.id;
      } else {
        // Repli si la migration 0034 n'est pas déployée sur le projet distant.
        if (rpcError) {
          console.warn(
            "[saveEventDraftAction] RPC become_organizer indisponible :",
            rpcError.message,
          );
        }

        const emailPrefix = (user.email ?? "").split("@")[0] || "org";
        const slugBase = emailPrefix.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "org";
        const slug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Garantir le rôle organisateur (silencieusement refusé par la RLS).
        await supabase.from("user_roles").insert({
          user_id: user.id,
          role: "organizer",
        } as any);

        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({
            owner_id: user.id,
            name: orgName,
            slug,
          } as any)
          .select("id")
          .single();

        if (newOrg) {
          orgId = newOrg.id;
          await supabase.from("organization_members").insert({
            organization_id: orgId,
            user_id: user.id,
            role: "owner",
            status: "active",
          } as any);
        }
      }
    }

    if (!orgId) {
      return {
        ok: false,
        error: "Impossible d'identifier votre organisation. Veuillez d'abord la configurer.",
      };
    }

    // 3. Générer le slug de l'événement
    const titleSlug =
      input.title
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "evenement";
    const slug = `${titleSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Formater les dates
    const startAtIso = new Date(input.startAt).toISOString();
    const endAtIso =
      input.endAt && input.endAt.trim()
        ? new Date(input.endAt).toISOString()
        : new Date(new Date(input.startAt).getTime() + 2 * 3600 * 1000).toISOString();

    // La vue publique `published_events` n'expose que les événements dont la fin
    // est à venir (`end_at >= now()`) : un événement passé serait invisible dans
    // Explorer même une fois publié, on refuse donc la création tout de suite.
    if (new Date(endAtIso).getTime() <= Date.now()) {
      return {
        ok: false,
        error:
          "La date de fin doit être dans le futur : Explorer n'affiche que les événements à venir.",
      };
    }

    // 5. Insérer l'événement dans Supabase
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        organization_id: orgId,
        created_by: user.id,
        title: input.title.trim(),
        slug,
        category: input.category || "autres",
        city: input.city?.trim() || "Abidjan",
        venue_name: input.venueName?.trim() || null,
        address: input.venueName?.trim() || null,
        description: input.description?.trim() || null,
        cover_url: sanitizeCoverUrl(input.coverUrl),
        gallery: sanitizeGalleryUrls(input.galleryUrls),
        start_at: startAtIso,
        end_at: endAtIso,
        status: "draft",
        salon_privacy: "members",
        currency: "XOF",
        min_price: 0,
        max_price: 0,
      } as any)
      .select("id, slug")
      .single();

    if (eventError) {
      console.error("[saveEventDraftAction] Error inserting event:", eventError);
      return { ok: false, error: `Erreur d'enregistrement : ${eventError.message}` };
    }

    // 5. Créer les formules de billets associées si fournies
    if (input.tickets && input.tickets.length > 0) {
      const ticketRows = input.tickets
        .filter((t) => t.name && t.name.trim())
        .map((t, idx) => ({
          event_id: event.id,
          name: t.name.trim(),
          description: t.description?.trim() || null,
          price: Math.max(0, Math.round(Number(t.price) || 0)),
          quantity: Math.max(1, Math.round(Number(t.quantity) || 50)),
          access_level: t.accessLevel || "standard",
          position: idx,
          is_active: true,
          covers_salon: true,
        }));

      if (ticketRows.length > 0) {
        const { error: ticketError } = await supabase
          .from("ticket_types")
          .insert(ticketRows as any);

        if (ticketError) {
          console.warn(
            "[saveEventDraftAction] Warning inserting ticket types:",
            ticketError.message,
          );
        }
      }
    }

    revalidatePath("/org/evenements");
    revalidatePath("/org");
    return { ok: true, eventId: event.id, slug: event.slug };
  } catch (err: any) {
    console.error("[saveEventDraftAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/* =============================================================================
   Publication / dépublication
   --------------------------------------------------------------------------
   La vue publique `published_events` (cf. 0022) ne contient QUE les événements
   `status = 'published'` dont `end_at >= now()`. Un événement enregistré comme
   brouillon est donc invisible dans Explorer : il faut le publier.
   Seul le gestionnaire de l'événement peut le faire : l'écriture passe par la
   RLS `events_update_managers` (donc jamais par une clé de service).
   ========================================================================== */

/** Statuts qu'un organisateur peut appliquer depuis son espace. */
export type PublishableEventStatus = "draft" | "published" | "cancelled" | "completed";

export interface SetEventStatusResult {
  ok: boolean;
  status?: string;
  slug?: string;
  /** Avertissement non bloquant (ex : événement déjà terminé, salon non créé). */
  warning?: string;
  error?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENT_STATUS_VALUES: PublishableEventStatus[] = [
  "draft",
  "published",
  "cancelled",
  "completed",
];

/**
 * Change le statut de publication d'un événement géré par l'utilisateur connecté.
 * À la publication, le salon communautaire de l'événement est garanti
 * (`ensure_event_salon`) : les participants disposent donc immédiatement
 * de l'espace d'échange.
 */
export async function setEventStatusAction(
  eventId: string,
  status: PublishableEventStatus,
): Promise<SetEventStatusResult> {
  if (!eventId) {
    return { ok: false, error: "Événement introuvable." };
  }

  // Les brouillons de secours stockés dans le navigateur (`draft-…`) n'existent
  // pas en base : impossible de les publier, l'erreur doit être explicite.
  if (!UUID_PATTERN.test(eventId)) {
    return {
      ok: false,
      error:
        "Cet événement n'a été enregistré que dans votre navigateur : recréez-le pour le publier.",
    };
  }

  if (!EVENT_STATUS_VALUES.includes(status)) {
    return { ok: false, error: "Statut d'événement invalide." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté pour publier un événement." };
    }

    const published = status === "published";

    const { data: event, error: updateError } = await supabase
      .from("events")
      .update({
        status,
        published_at: published ? new Date().toISOString() : null,
      } as any)
      .eq("id", eventId)
      .select("id, slug, status, end_at")
      .maybeSingle();

    if (updateError) {
      console.error("[setEventStatusAction] Error updating event:", updateError);
      return { ok: false, error: `Mise à jour impossible : ${updateError.message}` };
    }

    // Aucune ligne renvoyée = événement inexistant ou non géré par cet utilisateur
    // (la RLS filtre silencieusement).
    if (!event) {
      return {
        ok: false,
        error: "Événement introuvable ou vous n'êtes pas autorisé à le modifier.",
      };
    }

    let warning: string | undefined;

    if (published) {
      const { error: salonError } = await supabase.rpc("ensure_event_salon", {
        target_event_id: eventId,
      });

      if (salonError) {
        console.warn("[setEventStatusAction] Salon non créé :", salonError.message);
        warning = "L'événement est publié, mais le salon communautaire n'a pas pu être créé.";
      }

      // La vue publique exclut les événements terminés : l'organisateur est prévenu.
      if (new Date(event.end_at).getTime() < Date.now()) {
        warning =
          "Attention : cet événement est déjà terminé (date de fin dépassée), il n'apparaîtra pas dans Explorer.";
      }
    }

    revalidatePath("/org/evenements");
    revalidatePath("/org");
    if (published) {
      revalidatePath("/explorer");
      revalidatePath("/");
      revalidatePath("/evenements/[slug]", "page");
    }

    return { ok: true, status: event.status, slug: event.slug, warning };
  } catch (err: any) {
    console.error("[setEventStatusAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/* =============================================================================
   Mise à jour des informations principales
   ========================================================================== */

export interface UpdateEventDetailsInput {
  eventId: string;
  title: string;
  city?: string;
  venueName?: string;
  /** Nouvelle date/heure de début (valeur `datetime-local` ou ISO). */
  startAt?: string;
  /** Nouvelle date/heure de fin (valeur `datetime-local` ou ISO). */
  endAt?: string;
  /**
   * Image de couverture : URL https publique, `null` pour la retirer.
   * Laisser `undefined` pour ne pas y toucher.
   */
  coverUrl?: string | null;
  /**
   * Nouvelle galerie complète (tableau d'URL https).
   * Laisser `undefined` pour ne pas y toucher ; un tableau vide la vide.
   */
  galleryUrls?: string[];
}

export interface UpdateEventDetailsResult {
  ok: boolean;
  warning?: string;
  error?: string;
}

export interface DeleteEventResult {
  ok: boolean;
  error?: string;
}

/** Supprime un événement géré par l'utilisateur, uniquement s'il n'a pas de billet émis. */
export async function deleteEventAction(eventId: string): Promise<DeleteEventResult> {
  if (!eventId || !UUID_PATTERN.test(eventId)) {
    return { ok: false, error: "Événement introuvable en base." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const { count, error: ticketsError } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (ticketsError) {
      console.error("[deleteEventAction] Ticket check error:", ticketsError);
      return { ok: false, error: "Impossible de vérifier les billets de cet événement." };
    }

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error:
          "Cet événement ne peut pas être supprimé car des billets ont déjà été émis. Dépubliez-le ou annulez-le pour conserver l'historique.",
      };
    }

    const { data: deleted, error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[deleteEventAction] Delete error:", error);
      return { ok: false, error: `Suppression impossible : ${error.message}` };
    }

    if (!deleted) {
      return {
        ok: false,
        error: "Événement introuvable ou vous n'êtes pas autorisé à le supprimer.",
      };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[deleteEventAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/**
 * Met à jour titre / ville / lieu et, si fournies, les dates d'un événement
 * géré par l'utilisateur connecté.
 *
 * Corriger les dates est essentiel : la vue publique `published_events` filtre
 * `end_at >= now()`. Un événement aux dates passées n'apparaît nulle part
 * (accueil, Explorer, annuaire des organisateurs), on le signale donc à
 * l'organisateur sans bloquer l'enregistrement.
 */
export async function updateEventDetailsAction(
  input: UpdateEventDetailsInput,
): Promise<UpdateEventDetailsResult> {
  if (!input.eventId || !UUID_PATTERN.test(input.eventId)) {
    return { ok: false, error: "Événement introuvable en base." };
  }

  const title = input.title?.trim();

  if (!title) {
    return { ok: false, error: "Le nom de l'événement ne peut pas être vide." };
  }

  let startIso: string | undefined;
  let endIso: string | undefined;

  if (input.startAt) {
    const parsed = new Date(input.startAt);
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "Date de début invalide." };
    startIso = parsed.toISOString();
  }

  if (input.endAt) {
    const parsed = new Date(input.endAt);
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "Date de fin invalide." };
    endIso = parsed.toISOString();
  }

  if (startIso && endIso && new Date(endIso).getTime() < new Date(startIso).getTime()) {
    return { ok: false, error: "La date de fin doit être postérieure à la date de début." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const payload: Record<string, unknown> = {
      title,
      city: input.city?.trim() || "Abidjan",
      venue_name: input.venueName?.trim() || null,
    };

    if (startIso) payload.start_at = startIso;
    if (endIso) payload.end_at = endIso;
    if (input.coverUrl !== undefined) payload.cover_url = sanitizeCoverUrl(input.coverUrl);
    if (input.galleryUrls !== undefined) payload.gallery = sanitizeGalleryUrls(input.galleryUrls);

    const { data: event, error } = await supabase
      .from("events")
      .update(payload as any)
      .eq("id", input.eventId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("[updateEventDetailsAction] Error:", error);
      return { ok: false, error: `Enregistrement impossible : ${error.message}` };
    }

    if (!event) {
      return {
        ok: false,
        error: "Événement introuvable ou vous n'êtes pas autorisé à le modifier.",
      };
    }

    // Résultat visible dans Explorer ? On prévient si l'événement est terminé.
    let warning: string | undefined;

    if (endIso) {
      const endedAt = new Date(endIso);
      if (endedAt.getTime() <= Date.now()) {
        warning =
          "Attention : la date de fin est dépassée. Explorer n'affiche que les événements à venir ; " +
          "cet événement n'apparaîtra pas dans la recherche publique.";
      } else if (event.status !== "published") {
        warning =
          "Cet événement reste en brouillon : publiez-le pour qu'il apparaisse dans Explorer.";
      }
    }

    return { ok: true, warning };
  } catch (err: any) {
    console.error("[updateEventDetailsAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/* =============================================================================
   Image de couverture
   --------------------------------------------------------------------------
   Utilisée juste après la création d'un événement : l'upload Storage exige
   que l'événement existe déjà (policy `can_manage_event`), on associe donc
   l'URL publique dans un second temps. La RLS `events_update_managers`
   garantit que seul un gestionnaire peut modifier `cover_url`.
   ========================================================================== */

export interface UpdateEventCoverResult {
  ok: boolean;
  error?: string;
}

/** Associe (ou retire, avec `null`) l'image de couverture d'un événement. */
export async function updateEventCoverAction(
  eventId: string,
  coverUrl: string | null,
  publishNow = false,
): Promise<UpdateEventCoverResult> {
  if (!eventId || !UUID_PATTERN.test(eventId)) {
    return { ok: false, error: "Événement introuvable en base." };
  }

  if (coverUrl && !sanitizeCoverUrl(coverUrl)) {
    return { ok: false, error: "L'URL de l'image de couverture est invalide." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const update: Record<string, unknown> = {
      cover_url: sanitizeCoverUrl(coverUrl),
    };
    if (publishNow) {
      update.status = "published";
      update.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("events")
      .update(update as any)
      .eq("id", eventId);

    if (error) {
      console.error("[updateEventCoverAction] Error:", error);
      return { ok: false, error: `Enregistrement impossible : ${error.message}` };
    }

    if (publishNow) {
      const { error: salonError } = await supabase.rpc("ensure_event_salon", {
        target_event_id: eventId,
      });
      if (salonError) {
        console.warn("[updateEventCoverAction] Salon non créé :", salonError.message);
      }
      revalidatePath("/explorer");
      revalidatePath("/");
      revalidatePath("/evenements/[slug]", "page");
    }
    revalidatePath("/org/evenements");
    revalidatePath("/org");

    return { ok: true };
  } catch (err: any) {
    console.error("[updateEventCoverAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/* =============================================================================
   Gestion des formules de billets (création / modification / suppression)
   ========================================================================== */

export interface UpdateEventGalleryResult {
  ok: boolean;
  error?: string;
}

/**
 * Remplace la galerie d'images d'un événement (`events.gallery`).
 * Chaque URL doit être une URL https publique (bucket `event-covers`).
 */
export async function updateEventGalleryAction(
  eventId: string,
  galleryUrls: string[],
): Promise<UpdateEventGalleryResult> {
  if (!eventId || !UUID_PATTERN.test(eventId)) {
    return { ok: false, error: "Événement introuvable en base." };
  }

  const gallery = sanitizeGalleryUrls(galleryUrls);

  if (galleryUrls.length > 0 && gallery.length === 0) {
    return { ok: false, error: "Aucune URL d'image valide (https uniquement)." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const { error } = await supabase
      .from("events")
      .update({ gallery } as any)
      .eq("id", eventId);

    if (error) {
      console.error("[updateEventGalleryAction] Error:", error);
      return { ok: false, error: `Enregistrement impossible : ${error.message}` };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[updateEventGalleryAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

export interface CreateEventTicketInput {
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  accessLevel: "standard" | "vip" | "vvip";
  description?: string;
}

export interface UpdateEventTicketInput {
  ticketId: string;
  name?: string;
  price?: number;
  quantity?: number;
  accessLevel?: "standard" | "vip" | "vvip";
  description?: string;
  isActive?: boolean;
}

export async function createTicketTypeAction(input: CreateEventTicketInput) {
  if (!input.eventId || !UUID_PATTERN.test(input.eventId)) {
    return { ok: false, error: "Identifiant d'événement invalide." };
  }
  if (!input.name || !input.name.trim()) {
    return { ok: false, error: "Le nom de la formule est obligatoire." };
  }
  if (input.price < 0) {
    return { ok: false, error: "Le tarif ne peut pas être négatif." };
  }
  if (input.quantity <= 0) {
    return { ok: false, error: "Le quota doit être supérieur à zéro." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const { data: ticket, error } = await supabase
      .from("ticket_types")
      .insert({
        event_id: input.eventId,
        name: input.name.trim(),
        price: Number(input.price) || 0,
        quantity: Number(input.quantity) || 1,
        access_level: input.accessLevel || "standard",
        description: input.description?.trim() || null,
        is_active: true,
        covers_salon: true,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("[createTicketTypeAction] Error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, ticket };
  } catch (err: any) {
    console.error("[createTicketTypeAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur est survenue." };
  }
}

export async function updateTicketTypeAction(input: UpdateEventTicketInput) {
  if (!input.ticketId || !UUID_PATTERN.test(input.ticketId)) {
    return { ok: false, error: "Identifiant de formule invalide." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const updatePayload: Record<string, any> = {};
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.price !== undefined) updatePayload.price = Number(input.price);
    if (input.quantity !== undefined) updatePayload.quantity = Number(input.quantity);
    if (input.accessLevel !== undefined) updatePayload.access_level = input.accessLevel;
    if (input.description !== undefined)
      updatePayload.description = input.description?.trim() || null;
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

    const { error } = await supabase
      .from("ticket_types")
      .update(updatePayload as any)
      .eq("id", input.ticketId);

    if (error) {
      console.error("[updateTicketTypeAction] Error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[updateTicketTypeAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur est survenue." };
  }
}

export async function deleteTicketTypeAction(ticketId: string) {
  if (!ticketId || !UUID_PATTERN.test(ticketId)) {
    return { ok: false, error: "Identifiant de formule invalide." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Vous devez être connecté." };
    }

    const { error } = await supabase.from("ticket_types").delete().eq("id", ticketId);

    if (error) {
      console.error("[deleteTicketTypeAction] Error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[deleteTicketTypeAction] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur est survenue." };
  }
}
