import { HomeExperience } from "@/components/home/home-experience";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getFeaturedEvents } from "@/lib/events/queries";

export default async function HomePage() {
  const events = await getFeaturedEvents(24).catch(() => []);
  const visibleEvents = events.filter((event) => !event.city.toLocaleLowerCase("fr").includes("bassam"));

  return (
    <div className="home-page flex min-h-dvh flex-col bg-bg text-fg transition-colors duration-300">
      <SiteHeader />
      <main id="contenu" className="flex-1">
        <HomeExperience events={visibleEvents} />
      </main>
      <SiteFooter />
    </div>
  );
}
