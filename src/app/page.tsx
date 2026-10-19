import { HomeExperience } from "@/components/home/home-experience";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchBar } from "@/components/layout/search-bar";
import { getFeaturedEvents } from "@/lib/events/queries";

export default async function HomePage() {
  const events = await getFeaturedEvents(16).catch(() => []);

  return (
    <div className="home-page flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="home-search-dock">
        <SearchBar className="home-search-control" />
      </div>
      <main id="contenu">
        <HomeExperience events={events} />
      </main>
      <SiteFooter />
    </div>
  );
}
