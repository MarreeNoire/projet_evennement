import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { buildHeroSnapshot, getHeroWeekRange } from "@/components/home/hero/data";
import { EventHeroDashboard } from "@/components/home/hero/dashboard-preview";
import { HeroBackground } from "@/components/home/hero/hero-background";
import { EventHeroNavbar } from "@/components/home/hero/navbar";
import { getWeekSnapshot } from "@/components/home/home-data";
import { APP_NAME } from "@/lib/constants";
import {
  getEventCities,
  getPublicOrganizers,
  searchPublishedEvents,
  type ExploreResult,
} from "@/lib/events/queries";

import "@/styles/fonts.css";
import "@/styles/home-hero.css";

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
  const weekNow = getWeekSnapshot();
  const weekRange = getHeroWeekRange(weekNow);

  const [upcoming, thisWeek, organizers, cities] = await Promise.all([
    loadWithRetry(() => searchPublishedEvents({ sort: "date_asc", pageSize: 48 }), EMPTY_RESULT),
    loadWithRetry(
      () =>
        searchPublishedEvents({
          startDate: weekRange.startDate,
          endDate: weekRange.endDate,
          pageSize: 1,
        }),
      EMPTY_RESULT,
    ),
    loadWithRetry(() => getPublicOrganizers(), []),
    loadWithRetry(() => getEventCities(), []),
  ]);

  /* Même règle de visibilité que l'ancienne page d'accueil : les sorties de
     Bassam ne sont pas mises en avant dans le hero. */
  const visibleEvents = upcoming.events.filter(
    (event) => !event.city.toLocaleLowerCase("fr").includes("bassam"),
  );

  const snapshot = buildHeroSnapshot({
    events: visibleEvents,
    totalEvents: upcoming.total,
    thisWeekEvents: thisWeek.total,
    organizers,
    cities,
  });

  return (
    <main className="event-hero-page min-h-screen w-full bg-[#ededed] p-3 sm:p-4">
      <section
        aria-labelledby="event-hero-title"
        className="relative h-[calc(100vh-24px)] w-full overflow-hidden rounded-2xl bg-[#d9d9d9] sm:h-[calc(100vh-32px)] sm:rounded-3xl"
      >
        <HeroBackground />
        <div aria-hidden="true" className="absolute inset-0 bg-white/10" />

        <div className="relative z-10">
          <EventHeroNavbar />

          <div className="flex flex-col items-center px-4 pt-8 pb-4 text-center sm:pt-10 sm:pb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-neutral-800 shadow-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#ef4d23]" />
              {APP_NAME} · Côte d&apos;Ivoire
            </div>

            <h1
              id="event-hero-title"
              className="event-hero-heading mt-5 max-w-4xl text-neutral-900 sm:mt-6"
              style={{
                fontSize: "clamp(36px, 8vw, 72px)",
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Les{" "}
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                événements
              </span>
              <br />
              de demain
            </h1>

            <p
              className="mt-4 px-2 text-neutral-700 sm:mt-6"
              style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}
            >
              Découvre les sorties qui comptent en Côte d&apos;Ivoire, réserve ta place et rencontre
              ta communauté.
            </p>

            <Link
              href="/explorer"
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#0b0f1a] py-2 pr-2 pl-6 text-[14px] font-medium text-white hover:bg-black sm:mt-8 sm:py-2.5 sm:pl-7"
            >
              Explorer les événements
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 sm:h-7 sm:w-7">
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <EventHeroDashboard snapshot={snapshot} />
        </div>
      </section>
    </main>
  );
}
