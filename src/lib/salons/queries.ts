/** Requetes de lecture pour le salon communautaire. */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SalonRow, ReactionType } from "@/types/database";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type {
  PostWithAuthor,
  CommentWithAuthor,
  SalonMemberWithProfile,
  SalonWithMemberCount,
} from "@/lib/salons/types";

/**
 * Retourne les publications d'un salon, les plus recentes d'abord.
 * Les announcements epingles (is_pinned) sont renvoyes en premier.
 * Enrichit chaque post de la reaction courante de l'utilisateur.
 */
export async function getSalonPosts(
  salonId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<PostWithAuthor[]> {
  const supabase = await createSupabaseServerClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey ( id, display_name, avatar_url, is_verified ),
      media:media!media_post_id_fkey ( url, thumbnail_url, kind, storage_path ),
      reaction_count,
      comment_count,
      is_pinned,
      is_hidden,
      created_at,
      updated_at
    `,
    )
    .eq("salon_id", salonId)
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[getSalonPosts]", error.message);
    return [];
  }

  const postList = posts ?? [];

  const paths = [
    ...new Set(
      postList.flatMap((post: any) =>
        (post.media ?? []).map((item: any) => item.storage_path).filter(Boolean),
      ),
    ),
  ];
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: signedUrls } = await supabase.storage
      .from(STORAGE_BUCKETS.SALON_PHOTOS)
      .createSignedUrls(paths, 3600);
    for (const item of signedUrls ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }

  // Mes réactions uniquement (la policy de lecture expose celles de tout le salon)
  const postIds = postList.map((p: any) => p.id);
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: myReactions } =
    currentUser && postIds.length > 0
      ? await supabase
          .from("reactions")
          .select("post_id, reaction")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds)
      : { data: [] as { post_id: string | null; reaction: ReactionType }[] };

  const reactionMap = new Map<string, ReactionType>();
  for (const r of myReactions ?? []) {
    if (r.post_id) reactionMap.set(r.post_id, r.reaction);
  }

  return postList.map((post: any) => ({
    ...post,
    media: (post.media ?? [])
      .map((item: any) => ({
        ...item,
        url: item.storage_path ? (signed.get(item.storage_path) ?? "") : item.url,
      }))
      .filter((item: any) => item.url),
    my_reaction: post.id && reactionMap.has(post.id) ? (reactionMap.get(post.id) ?? null) : null,
    has_reacted: post.id ? reactionMap.has(post.id) : false,
  })) as PostWithAuthor[];
}

/** Photos visibles du salon, avec une URL temporaire vers le bucket privé. */
export async function getSalonMedia(salonId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media")
    .select("id, storage_path, caption, created_at, uploader_id")
    .eq("salon_id", salonId)
    .eq("kind", "image")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error || !data?.length) return [];

  const { data: signedUrls } = await supabase.storage
    .from(STORAGE_BUCKETS.SALON_PHOTOS)
    .createSignedUrls([...new Set(data.map((item) => item.storage_path))], 3600);
  const signed = new Map(
    (signedUrls ?? []).flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
  return data.flatMap((item) => {
    const url = signed.get(item.storage_path);
    return url ? [{ ...item, url }] : [];
  });
}

/**
 * Retourne les commentaires d'un post, organises hierarchiquement.
 * Limite a 2 niveaux d'imbrication.
 */
export async function getPostComments(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createSupabaseServerClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      author:profiles!comments_author_id_fkey ( id, display_name, avatar_url, is_verified ),
      parent_id
    `,
    )
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getPostComments]", error.message);
    return [];
  }

  const flat = comments ?? [];

  // Recuperer toutes les reactions de l'utilisateur courant sur ces commentaires
  const commentIds = flat.map((c: any) => c.id);
  const { data: myReactions } = await supabase
    .from("reactions")
    .select("comment_id, reaction")
    .in("comment_id", commentIds);

  const reactionMap = new Map<string, ReactionType>();
  for (const r of myReactions ?? []) {
    if (r.comment_id) reactionMap.set(r.comment_id, r.reaction);
  }

  const enriched = flat.map((comment: any) => ({
    ...comment,
    my_reaction:
      comment.id && reactionMap.has(comment.id) ? (reactionMap.get(comment.id) ?? null) : null,
    has_reacted: comment.id ? reactionMap.has(comment.id) : false,
    replies: [] as CommentWithAuthor[],
  })) as CommentWithAuthor[];

  // Organiser en arbre : racines + reponses
  const roots = enriched.filter((c) => c.parent_id === null);
  const replies = enriched.filter((c) => c.parent_id !== null);

  for (const reply of replies) {
    const parent = enriched.find((c) => c.id === reply.parent_id);
    if (parent) {
      parent.replies.push(reply);
    }
  }

  return roots;
}

/**
 * Retourne les infos d'un salon par son ID, avec le nombre de membres.
 */
export async function getSalonById(salonId: string): Promise<SalonWithMemberCount | null> {
  const supabase = await createSupabaseServerClient();

  // Recuperer les infos de base du salon
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      `
      *,
      _member_count: salon_members (count)
    `,
    )
    .eq("id", salonId)
    .single();

  if (salonError || !salon) {
    console.error("[getSalonById]", salonError?.message);
    return null;
  }

  // Recuperer les membres récents (optionnel, pour l'affichage)
  const { data: members, error: membersError } = await supabase
    .from("salon_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      left_at
    `,
    )
    .eq("salon_id", salonId)
    .is("left_at", null)
    .order("joined_at", { ascending: false })
    .limit(6);

  if (membersError) {
    console.error("[getSalonById] members error", membersError.message);
    // On continue quand même sans les membres
  }

  return {
    ...salon,
    members: (members ?? []).map((m) => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
    })),
  } as SalonWithMemberCount;
}

/**
 * Retourne la liste des salons disponibles, avec filtres et pagination.
 * @param filters - Options de filtrage et pagination
 */
export interface SalonFilters {
  query?: string; // Recherche textuelle dans nom/description
  category?: string; // Filtre par catégorie
  limit?: number; // Nombre de résultats par page
  offset?: number; // Offset pour la pagination
  sort?: "recent" | "popular" | "name"; // Tri
}

/**
 * Résultat de la recherche de salons.
 */
export interface SalonResult {
  salons: SalonWithMemberCount[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Recherche de salons avec filtres et pagination.
 */
export async function searchSalons(filters: SalonFilters = {}): Promise<SalonResult> {
  const supabase = await createSupabaseServerClient();
  const limit = Math.max(filters.limit ?? 10, 1);
  const offset = Math.max(filters.offset ?? 0, 0);

  // Construire la requête de base
  let query = supabase
    .from("salons")
    .select(
      `
      *,
      _member_count: salon_members (count)
    `,
    )
    .is("deleted_at", null) // Exclure les salons supprimés
    .order("created_at", { ascending: false }); // Tri par défaut: plus récents d'abord

  // Appliquer les filtres
  if (filters.query) {
    const term = filters.query.trim().replace(/[%_]/g, "");
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  if (filters.category) {
    query = query.eq("name" as any, filters.category);
  }

  // Appliquer le tri
  switch (filters.sort ?? "recent") {
    case "popular":
      query = query.order("_member_count", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Exécuter la requête avec pagination
  const { data: salons, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("[searchSalons]", error.message);
    return {
      salons: [],
      total: 0,
      limit,
      offset,
    };
  }

  const total = count ?? 0;

  // Enrichir avec les membres récents pour chaque salon
  const salonsWithMembers: SalonWithMemberCount[] = [];
  for (const salon of salons ?? []) {
    const { data: members, error: membersError } = await supabase
      .from("salon_members")
      .select(
        `
        user_id,
        role,
        joined_at
      `,
      )
      .eq("salon_id", salon.id)
      .is("left_at", null)
      .order("joined_at", { ascending: false })
      .limit(6);

    if (!membersError) {
      salonsWithMembers.push({
        ...salon,
        members: (members ?? []).map((m) => ({
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
        })),
      } as SalonWithMemberCount);
    } else {
      // En cas d'erreur, on retourne quand même le salon sans les membres
      salonsWithMembers.push({
        ...salon,
        members: [],
      } as SalonWithMemberCount);
    }
  }

  return {
    salons: salonsWithMembers,
    total,
    limit,
    offset,
  };
}

/**
 * Retourne la liste des salons auxquels l'utilisateur actuel appartient.
 */
export async function getUserSalons(): Promise<SalonWithMemberCount[]> {
  const supabase = await createSupabaseServerClient();

  // Récupérer l'utilisateur actuel de façon sûre
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("[getUserSalons]", authError?.message ?? "Utilisateur non authentifié");
    return [];
  }
  const userId = user.id;

  // D'abord, récupérer les IDs des salons où l'utilisateur est membre
  const { data: memberships, error: membershipsError } = await supabase
    .from("salon_members")
    .select("salon_id, role, joined_at")
    .eq("user_id", userId)
    .is("left_at", null);

  if (membershipsError || !memberships) {
    console.error("[getUserSalons]", membershipsError?.message);
    return [];
  }

  // Pour chaque salon, récupérer les infos complètes
  const salons: SalonWithMemberCount[] = [];
  for (const membership of memberships) {
    const salon = await getSalonById(membership.salon_id);
    if (salon) {
      salons.push(salon);
    }
  }

  return salons;
}

/** Retourne les publications les plus recentes de toute la plateforme pour le fil communautaire. */
export async function getGlobalRecentPosts(limit = 10): Promise<PostWithAuthor[]> {
  const supabase = await createSupabaseServerClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey ( id, display_name, avatar_url, is_verified ),
      media:media!media_post_id_fkey ( url, thumbnail_url, kind ),
      reaction_count,
      comment_count,
      is_pinned,
      is_hidden,
      created_at,
      updated_at
    `,
    )
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !posts) {
    return [];
  }

  const postIds = posts.map((p: any) => p.id);
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: myReactions } =
    currentUser && postIds.length > 0
      ? await supabase
          .from("reactions")
          .select("post_id, reaction")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds)
      : { data: [] as { post_id: string | null; reaction: ReactionType }[] };

  const reactionMap = new Map<string, ReactionType>();
  for (const r of myReactions ?? []) {
    if (r.post_id) reactionMap.set(r.post_id, r.reaction);
  }

  return posts.map((post: any) => ({
    ...post,
    my_reaction: post.id && reactionMap.has(post.id) ? (reactionMap.get(post.id) ?? null) : null,
    has_reacted: post.id ? reactionMap.has(post.id) : false,
  })) as PostWithAuthor[];
}

/**
 * Retourne les membres d'un salon spécifié.
 * @param salonId - ID du salon
 * @param limit - Nombre maximal de membres à retourner
 */
export async function getSalonMembers(
  salonId: string,
  limit = 20,
): Promise<SalonMemberWithProfile[]> {
  const supabase = await createSupabaseServerClient();

  const { data: members, error } = await supabase
    .from("salon_members")
    .select(
      `
      *,
      profile:profiles!salon_members_user_id_fkey (
        id,
        display_name,
        avatar_url,
        city,
        is_verified
      )
    `,
    )
    .eq("salon_id", salonId)
    .is("left_at", null)
    .order("joined_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getSalonMembers]", error.message);
    return [];
  }

  return (members ?? []).map((m) => ({
    ...m,
    profile: (m as any).profile ?? null,
    is_online: false, // TODO: Implémenter la détection de présence en ligne
  })) as unknown as SalonMemberWithProfile[];
}

/* -----------------------------------------------------------------------------
   Événements rattachés aux salons (dates, lieu) : servent à calculer la phase
   Avant / Sur place / Après et à afficher l'affiche du salon.
   -------------------------------------------------------------------------- */

export interface SalonEventInfo {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  end_at: string;
  city: string;
  venue_name: string | null;
  cover_url: string | null;
  allow_media_upload: boolean;
}

export async function getEventsByIds(ids: string[]): Promise<Map<string, SalonEventInfo>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const result = new Map<string, SalonEventInfo>();
  if (unique.length === 0) return result;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, slug, start_at, end_at, city, venue_name, cover_url, allow_media_upload")
    .in("id", unique);

  if (error) {
    console.error("[getEventsByIds]", error.message);
    return result;
  }

  for (const row of (data ?? []) as unknown as SalonEventInfo[]) {
    result.set(row.id, row);
  }
  return result;
}

/** Commentaires de plusieurs publications en une seule requête, groupés par publication. */
export async function getCommentsByPost(
  postIds: string[],
): Promise<Map<string, CommentWithAuthor[]>> {
  const grouped = new Map<string, CommentWithAuthor[]>();
  if (postIds.length === 0) return grouped;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, post_id, parent_id, content, created_at,
       author:profiles!comments_author_id_fkey ( id, display_name, avatar_url, is_verified )`,
    )
    .in("post_id", postIds)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getCommentsByPost]", error.message);
    return grouped;
  }

  for (const row of (data ?? []) as unknown as CommentWithAuthor[]) {
    const list = grouped.get(row.post_id) ?? [];
    list.push(row);
    grouped.set(row.post_id, list);
  }
  return grouped;
}
