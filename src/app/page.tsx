import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { EventGrid } from "@/components/events/event-card";
import { HeroBackground } from "@/components/home/hero/hero-background";
import { EventHeroNavbar } from "@/components/home/hero/navbar";
import { APP_NAME } from "@/lib/constants";
import { searchPublishedEvents, type ExploreResult } from "@/lib/events/queries";

import "@/styles/home-hero.css";

const EMPTY_RESULT: ExploreResult = {
  events: [],
  total: 0,
  page: 1,
  pageSize: 48,
  totalPages: 1,
};

const TICKER_ITEMS = ["Billets QR", "Salons d'événement", "Paiement en ligne", "Côte d'Ivoire"];

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

/** Le bandeau est dupliqué pour que la boucle du défilement soit invisible. */
function TickerGroup() {
  return (
    <div className="home-ticker-group">
      {TICKER_ITEMS.map((item) => (
        <span key={item} className="home-ticker-item">
          {item}
        </span>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const upcoming = await loadWithRetry(
    () => searchPublishedEvents({ sort: "date_asc", pageSize: 48 }),
    EMPTY_RESULT,
  );

  /* Même règle de visibilité que l'ancienne page d'accueil : les sorties de
     Bassam ne sont pas mises en avant dans le hero. */
  const visibleEvents = upcoming.events.filter(
    (event) => !event.city.toLocaleLowerCase("fr").includes("bassam"),
  );

  const lineup = visibleEvents.slice(0, 6);

  return (
    <main className="home-page">
      <div className="home-frame">
        <section aria-labelledby="event-hero-title" className="home-stage">
          <HeroBackground />
          <div aria-hidden="true" className="home-stage-veil" />

          <div className="home-stage-inner">
            <EventHeroNavbar />

            <div className="home-ticker" aria-hidden="true">
              <div className="home-ticker-track">
                <TickerGroup />
                <TickerGroup />
              </div>
            </div>

            <div className="home-hero-copy">
              <p className="home-eyebrow">Événements · {APP_NAME}</p>

              <h1 id="event-hero-title" className="home-hero-title">
                Les <span className="home-hero-title-outline">événements</span>
                <br />
                de demain
              </h1>

              <p className="home-hero-lead">
                Découvre les sorties qui comptent en Côte d&apos;Ivoire, réserve ta place et
                rencontre ta communauté.
              </p>

              <div className="home-hero-actions">
                <Link href="/explorer" className="home-btn home-btn-primary">
                  Explorer les événements
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
                <Link href="/devenir-organisateur" className="home-btn home-btn-ghost">
                  Devenir organisateur
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="home-lineup-title" className="home-lineup">
          <header className="home-lineup-head">
            <div>
              <p className="home-eyebrow home-eyebrow-ink">À l&apos;affiche</p>
              <h2 id="home-lineup-title" className="home-lineup-title">
                Les prochaines sorties
              </h2>
            </div>
            <Link href="/explorer" className="home-link-arrow">
              Tout voir
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </header>

          {lineup.length > 0 ? (
            <EventGrid events={lineup} />
          ) : (
            <div className="glass-surface home-empty">
              <strong>Aucune sortie publiée pour le moment.</strong>
              <span>
                Les prochains événements apparaîtront ici dès leur publication par un organisateur.
              </span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
