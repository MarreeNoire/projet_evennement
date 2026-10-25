import {
  HomeEditorial,
  type EditorialEvent,
} from "@/components/home/editorial/home-editorial";
import { loadHeaderUser } from "@/lib/auth/viewer";
import { getCategoryLabel } from "@/lib/constants";
import { searchPublishedEvents, type ExploreResult } from "@/lib/events/queries";

const EMPTY_RESULT: ExploreResult = {
  events: [],
  total: 0,
  page: 1,
  pageSize: 48,
  totalPages: 1,
};

/** Une reprise pour absorber un incident réseau transitoire au premier rendu. */
async function loadWithRetry<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    try {
      return await load();
    } catch {
      return fallback;
    }
  }
}

export default async function HomePage() {
  const [upcoming, viewer] = await Promise.all([
    loadWithRetry(
      () => searchPublishedEvents({ sort: "date_asc", pageSize: 48 }),
      EMPTY_RESULT,
    ),
    loadHeaderUser(),
  ]);

  /* Même règle de visibilité que l'ancienne page d'accueil : les sorties de
     Bassam ne sont pas mises en avant sur l'accueil. */
  const visibleEvents = upcoming.events.filter(
    (event) => !event.city.toLocaleLowerCase("fr").includes("bassam"),
  );

  const events: EditorialEvent[] = visibleEvents.slice(0, 8).map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    summary: event.summary,
    coverUrl: event.cover_url,
    category: event.category,
    categoryLabel: getCategoryLabel(event.category),
    venueName: event.venue_name,
    city: event.city,
    startAt: event.start_at,
    minPrice: event.min_price,
    maxPrice: event.max_price,
    organizerName: event.organizer_name,
    organizerVerified: event.organizer_verified,
  }));

  return <HomeEditorial events={events} viewer={viewer} />;
}
