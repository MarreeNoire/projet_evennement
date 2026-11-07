import { HomeGlass } from "@/components/home/home-glass";
import { searchPublishedEvents } from "@/lib/events/queries";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";

/** Une reprise pour absorber un incident réseau transitoire au premier rendu. */
async function loadWithRetry<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    try {
      return await load();
    } catch {
      return null;
    }
  }
}

export default async function HomePage() {
  const upcoming = await loadWithRetry(() =>
    searchPublishedEvents({ sort: "date_asc", pageSize: 48, includeFirstTicketType: true }),
  );

  /* Même règle de visibilité que l'ancienne page d'accueil : les sorties de
     Bassam ne sont pas mises en avant sur l'accueil. */
  const visibleEvents = (upcoming?.events ?? []).filter(
    (event) => !event.city.toLocaleLowerCase("fr").includes("bassam"),
  );

  const events = visibleEvents.slice(0, 8);

  return (
    <EditorialShell>
      <HomeGlass events={events} total={upcoming?.total ?? 0} />
    </EditorialShell>
  );
}
