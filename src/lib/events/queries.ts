import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublishedEventView } from "@/types/database";

/* =============================================================================
   Requêtes publiques — événements
   --------------------------------------------------------------------------
   Lecture seule via la vue `published_events` (brouillons jamais exposés).
   `createSupabaseServerClient` respecte RLS : un visiteur anonyme ne voit que
   le publié à venir, conformément aux politiques `events_select_anon`.
   ========================================================================== */

export interface ExploreFilters {
  query?: string;
  category?: string;
  city?: string;
  /** Prix maximum en FCFA. */
  maxPrice?: number;
  /** Uniquement les événements gratuits. */
  freeOnly?: boolean;
  sort?: "date_asc" | "popular" | "price_asc" | "price_desc" | "recent";
  page?: number;
  pageSize?: number;
}

export interface ExploreResult {
  events: PublishedEventView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Prochains événements publiés, avec recherche / filtres / tri / pagination. */
export async function searchPublishedEvents(filters: ExploreFilters = {}): Promise<ExploreResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 48);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("published_events").select("*", { count: "exact" });

  if (filters.query) {
    // Recherche plein texte simple : titre, résumé, ville, lieu.
    const term = filters.query.trim().replace(/[%_]/g, "");
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,summary.ilike.%${term}%,city.ilike.%${term}%,venue_name.ilike.%${term}%`,
      );
    }
  }

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.city) query = query.ilike("city", `%${filters.city.trim()}%`);
  if (filters.freeOnly) {
    query = query.eq("min_price", 0);
  } else if (typeof filters.maxPrice === "number") {
    query = query.lte("min_price", filters.maxPrice);
  }

  switch (filters.sort ?? "date_asc") {
    case "price_asc":
      query = query.order("min_price", { ascending: true }).order("start_at");
      break;
    case "price_desc":
      query = query.order("min_price", { ascending: false }).order("start_at");
      break;
    case "popular":
      // Faute de compteur public, les mieux remplis d'abord via prix max.
      query = query.order("max_price", { ascending: false }).order("start_at");
      break;
    case "recent":
      query = query.order("start_at", { ascending: false });
      break;
    case "date_asc":
    default:
      query = query.order("start_at", { ascending: true });
      break;
  }

  const { data, count, error } = await query.range(from, to);

  if (error) throw new Error(`Recherche des événements impossible : ${error.message}`);

  const total = count ?? 0;

  return {
    events: (data ?? []) as PublishedEventView[],
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

/** Détail public d'un événement via son slug (billet + salon + programme). */
export async function getPublishedEventBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data: event, error } = await supabase
    .from("published_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Événement introuvable : ${error.message}`);
  if (!event) return null;

  const typed = event as PublishedEventView;

  // Description longue : la vue publique ne l'expose pas (charge utile réduite),
  // on la lit directement avec RLS (même règle : publié ou gestionnaire).
  // Billetterie active : types visibles et en vente, triés par prix.
  // Programme + intervenants.
  const [{ data: detail }, { data: ticketTypes }, { data: sessions }, { data: speakers }] =
    await Promise.all([
      supabase.from("events").select("description").eq("id", typed.id).maybeSingle(),
      supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", typed.id)
        .eq("is_active", true)
        .order("price", { ascending: true }),
      supabase
        .from("event_sessions")
        .select("*")
        .eq("event_id", typed.id)
        .order("start_at")
        .order("position"),
      supabase.from("event_speakers").select("*").eq("event_id", typed.id).order("position"),
    ]);

  return {
    event: typed,
    description: (detail as { description: string | null } | null)?.description ?? null,
    ticketTypes: ticketTypes ?? [],
    sessions: sessions ?? [],
    speakers: speakers ?? [],
  };
}

/** Événements à venir mis en avant sur l'accueil (les plus proches). */
export async function getFeaturedEvents(limit = 6): Promise<PublishedEventView[]> {
  const { events } = await searchPublishedEvents({ sort: "date_asc", page: 1, pageSize: limit });
  return events;
}

/** Villes proposant des événements (pour le filtre ville). */
export async function getEventCities(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("published_events").select("city").limit(200);
  if (error || !data) return [];
  return [...new Set(data.map((row) => (row as { city: string }).city).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "fr"),
  );
}
