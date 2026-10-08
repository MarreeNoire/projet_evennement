import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDateInput, startOfDayAfter } from "@/lib/events/date-range";
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
  startDate?: string;
  endDate?: string;
  /** Prix maximum en FCFA. */
  maxPrice?: number;
  /** Uniquement les événements gratuits. */
  freeOnly?: boolean;
  sort?: "date_asc" | "date_desc" | "price_asc" | "price_desc";
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
  if (isDateInput(filters.startDate)) {
    query = query.gte("start_at", `${filters.startDate}T00:00:00.000Z`);
  }
  if (isDateInput(filters.endDate)) {
    query = query.lt("start_at", startOfDayAfter(filters.endDate));
  }
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
    case "date_desc":
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
  const events = (data ?? []).map((event) => ({
    ...event,
    gallery: Array.isArray(event.gallery) ? event.gallery : [],
  })) as PublishedEventView[];

  return {
    events,
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

  const typed = {
    ...event,
    gallery: Array.isArray(event.gallery) ? event.gallery : [],
  } as PublishedEventView;

  // Description longue : la vue publique ne l'expose pas (charge utile réduite),
  // on la lit directement avec RLS (même règle : publié ou gestionnaire).
  // Billetterie active : types visibles et en vente, triés par prix.
  // Programme + intervenants.
  const [{ data: detail }, { data: ticketTypes }, { data: sessions }, { data: speakers }] =
    await Promise.all([
      supabase
        .from("events")
        .select("description, cover_url, gallery")
        .eq("id", typed.id)
        .maybeSingle(),
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
    event: {
      ...typed,
      cover_url: typed.cover_url ?? detail?.cover_url ?? null,
      gallery: typed.gallery.length
        ? typed.gallery
        : Array.isArray(detail?.gallery)
          ? detail.gallery
          : [],
    },
    description: detail?.description ?? null,
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

/* -----------------------------------------------------------------------------
   Annuaire des organisateurs
   -----------------------------------------------------------------------------
   Il n'existe pas (encore) de vue publique dédiée : on déduit les
   organisateurs des événements publiés à venir. Un organisateur sans
   événement à venir n'apparaît donc pas, ce qui évite d'afficher des
   organisations inactives ou en brouillon.
   -------------------------------------------------------------------------- */

export interface PublicOrganizer {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
  eventCount: number;
  cities: string[];
  nextEvent: { title: string; slug: string; startAt: string };
}

type OrganizerSourceRow = Pick<
  PublishedEventView,
  | "organization_id"
  | "organizer_name"
  | "organizer_slug"
  | "organizer_logo_url"
  | "organizer_verified"
  | "city"
  | "title"
  | "slug"
  | "start_at"
>;

/** Organisateurs ayant au moins un événement publié à venir. */
export async function getPublicOrganizers(): Promise<PublicOrganizer[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("published_events")
    .select(
      "organization_id, organizer_name, organizer_slug, organizer_logo_url, organizer_verified, city, title, slug, start_at",
    )
    .order("start_at", { ascending: true })
    .limit(500);

  if (error) throw new Error(`Chargement des organisateurs impossible : ${error.message}`);

  const organizers = new Map<string, PublicOrganizer>();

  // Les lignes arrivent triées par date : la première rencontrée est le prochain événement.
  for (const row of (data ?? []) as unknown as OrganizerSourceRow[]) {
    const existing = organizers.get(row.organization_id);

    if (existing) {
      existing.eventCount += 1;
      if (row.city && !existing.cities.includes(row.city)) existing.cities.push(row.city);
      continue;
    }

    organizers.set(row.organization_id, {
      id: row.organization_id,
      name: row.organizer_name,
      slug: row.organizer_slug,
      logoUrl: row.organizer_logo_url,
      verified: row.organizer_verified,
      eventCount: 1,
      cities: row.city ? [row.city] : [],
      nextEvent: { title: row.title, slug: row.slug, startAt: row.start_at },
    });
  }

  return [...organizers.values()].sort(
    (a, b) =>
      Number(b.verified) - Number(a.verified) ||
      b.eventCount - a.eventCount ||
      a.name.localeCompare(b.name, "fr"),
  );
}

/** Événements (brouillons et publiés) gérés par l'utilisateur connecté. */
export async function getOrganizerEvents() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Organisations possédées ET organisations dont l'utilisateur est membre
    // actif : un événement créé sous l'une ou l'autre doit rester visible ici.
    const [{ data: ownedOrgs }, { data: memberOrgs }] = await Promise.all([
      supabase.from("organizations").select("id").eq("owner_id", user.id),
      supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("role", ["owner", "manager"]),
    ]);

    const orgIds = [
      ...new Set([
        ...(ownedOrgs ?? []).map((org) => org.id),
        ...(memberOrgs ?? []).map((member) => member.organization_id),
      ]),
    ];

    if (orgIds.length === 0) return [];

    const { data: events } = await supabase
      .from("events")
      .select("*")
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false });

    return events ?? [];
  } catch (error) {
    console.error("Error in getOrganizerEvents:", error);
    return [];
  }
}

/* -----------------------------------------------------------------------------
   Supervision (super admin) : derniers événements lisibles
   --------------------------------------------------------------------------
   La politique `events_select_authenticated` (cf. 0022) n'expose que les
   événements publiés et ceux que l'utilisateur gère : cette liste reflète donc
   exactement ce que le compte courant a le droit de voir, sans jamais afficher
   de données fictives.
   -------------------------------------------------------------------------- */

export interface AdminEventListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  start_at: string;
  end_at: string;
  organizationName: string;
}

/** Derniers événements lisibles par l'utilisateur connecté (supervision admin). */
export async function getRecentEvents(limit = 20): Promise<AdminEventListItem[]> {
  try {
    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) return [];
    const { data: adminRole } = await sessionClient
      .from("user_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return [];

    // Les administrateurs doivent aussi pouvoir modérer les brouillons et les
    // événements d'organisations qu'ils ne gèrent pas.
    const supabase = createSupabaseAdminClient();
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, slug, status, start_at, end_at, organization_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error in getRecentEvents:", error);
      return [];
    }

    if (!events || events.length === 0) return [];

    // Les jointures ne sont pas typées dans `Database` : on résout les noms
    // d'organisation par une seconde requête, comme pour l'annuaire public.
    const orgIds = [...new Set(events.map((event) => event.organization_id))];
    const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", orgIds);
    const names = new Map((orgs ?? []).map((org) => [org.id, org.name]));

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      status: event.status,
      start_at: event.start_at,
      end_at: event.end_at,
      organizationName: names.get(event.organization_id) ?? "Organisation inconnue",
    }));
  } catch (error) {
    console.error("Error in getRecentEvents:", error);
    return [];
  }
}

export async function getOrganizerTicketTypes() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const [{ data: ownedOrgs }, { data: memberOrgs }] = await Promise.all([
      supabase.from("organizations").select("id").eq("owner_id", user.id),
      supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

    const orgIds = [
      ...new Set([
        ...(ownedOrgs ?? []).map((org) => org.id),
        ...(memberOrgs ?? []).map((member) => member.organization_id),
      ]),
    ];

    if (orgIds.length === 0) return [];

    const { data: events } = await supabase
      .from("events")
      .select("id, title")
      .in("organization_id", orgIds);

    if (!events || events.length === 0) return [];

    const eventIds = events.map((e) => e.id);
    const eventTitles = new Map(events.map((e) => [e.id, e.title]));

    const { data: tickets, error } = await supabase
      .from("ticket_types")
      .select("id, event_id, name, description, price, quantity, access_level, is_active")
      .in("event_id", eventIds)
      .order("position", { ascending: true });

    if (error || !tickets) return [];

    return tickets.map((t) => ({
      id: t.id,
      eventId: t.event_id,
      eventName: eventTitles.get(t.event_id) ?? "Événement",
      name: t.name,
      description: t.description,
      price: t.price,
      quantity: t.quantity,
      accessLevel: (t.access_level || "standard") as "standard" | "vip" | "vvip",
      isActive: t.is_active,
    }));
  } catch (error) {
    console.error("Error in getOrganizerTicketTypes:", error);
    return [];
  }
}

export async function getOrganizerEventTicketTypes(eventId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: tickets, error } = await supabase
      .from("ticket_types")
      .select("id, event_id, name, description, price, quantity, access_level, is_active")
      .eq("event_id", eventId)
      .order("position", { ascending: true });

    if (error || !tickets) return [];

    return tickets.map((t) => ({
      id: t.id,
      eventId: t.event_id,
      name: t.name,
      description: t.description,
      price: t.price,
      quantity: t.quantity,
      accessLevel: (t.access_level || "standard") as "standard" | "vip" | "vvip",
      isActive: t.is_active,
    }));
  } catch (error) {
    console.error("Error in getOrganizerEventTicketTypes:", error);
    return [];
  }
}
