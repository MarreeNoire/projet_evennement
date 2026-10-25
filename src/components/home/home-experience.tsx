"use client";

import { HomeHero } from "./home-hero";
import { TrendingEvents } from "./trending-events";
import { isThisWeekEvent, ThisWeekEvents } from "./this-week-events";
import type { PublishedEventView } from "@/types/database";

interface HomeExperienceProps {
  events: PublishedEventView[];
  /* Horodatage fourni par le serveur (voir page.tsx) — le composant reste
     pur pendant le rendu (règle react-hooks/purity) et l'hydratation
     reprend exactement la même fenêtre de 7 jours. */
  weekNow: number;
}

export function HomeExperience({ events, weekNow }: HomeExperienceProps) {
  /* Données réelles uniquement. Aucun contenu factice : si aucune sortie
     cette semaine, la liste des prochaines publications prend le relais sur
     mobile plutôt que de laisser un écran vide sous le carrousel. */
  const hasThisWeek = events.some((event) => isThisWeekEvent(event.start_at, weekNow));

  return (
    <div className="home-editorial relative min-h-screen">
      <HomeHero featuredEvents={events} />

      {/* Gradient de transition hero → contenu */}
      <div className="hero-content-transition" aria-hidden="true" />

      {/* Événements publiés à venir — le héros les présente sur mobile, sauf
          si aucune sortie cette semaine (le repli évite le blanc sous l'anneau). */}
      <div className={hasThisWeek ? "hidden md:block" : undefined}>
        <TrendingEvents events={events} />
      </div>

      {/* Sorties de la semaine, si elles existent */}
      <ThisWeekEvents events={events} nowMs={weekNow} />
    </div>
  );
}