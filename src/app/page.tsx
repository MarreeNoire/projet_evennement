import { HomeExperience } from "@/components/home/home-experience";
import { getWeekSnapshot } from "@/components/home/home-data";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getFeaturedEvents } from "@/lib/events/queries";

export default async function HomePage() {
  const events = await getFeaturedEvents(24).catch(() => []);
  const visibleEvents = events.filter((event) => !event.city.toLocaleLowerCase("fr").includes("bassam"));
  /* Horodatage fourni par la couche données (fonction libre dans home-data —
     la règle react-hooks/purity s'applique au corps des composants, pas aux
     fonctions d'accès aux données). La fenêtre « Cette semaine » reste
     déterministe entre le rendu initial et l'hydratation. */
  const weekNow = getWeekSnapshot();

  return (
    <div className="home-page flex min-h-dvh flex-col bg-bg text-fg transition-colors duration-300">
      <SiteHeader />
      <main id="contenu" className="flex-1">
        <HomeExperience events={visibleEvents} weekNow={weekNow} />
      </main>
      <SiteFooter />
    </div>
  );
}
