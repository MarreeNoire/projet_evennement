import { HomeExperience } from "@/components/home/home-experience";
import { countEventsThisWeek } from "@/components/home/home-data";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getFeaturedEvents } from "@/lib/events/queries";

export default async function HomePage() {
  const events = await getFeaturedEvents(24).catch(() => []);
  const visibleEvents = events.filter((event) => !event.city.toLocaleLowerCase("fr").includes("bassam"));
  const weekCount = countEventsThisWeek(visibleEvents);

  return (
    <div className="home-page flex min-h-dvh flex-col bg-bg text-fg transition-colors duration-300">
      <SiteHeader />
      <main id="contenu" className="flex-1">
        <HomeExperience events={visibleEvents} weekCount={weekCount} />
      </main>
      <SiteFooter />
    </div>
  );
}
