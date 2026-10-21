"use client";

import { ArchedHero } from "./arched-hero";
import { TrendingEvents } from "./trending-events";
import { ThisWeekEvents } from "./this-week-events";
import type { PublishedEventView } from "@/types/database";

interface HomeExperienceProps {
  events: PublishedEventView[];
}

export function HomeExperience({ events }: HomeExperienceProps) {
  return (
    <div className="home-editorial relative min-h-screen">
      <ArchedHero events={events} />

      {/* Événements publiés à venir — le hero les présente déjà sur mobile */}
      <div className="hidden lg:block">
        <TrendingEvents events={events} />
      </div>

      {/* Sorties de la semaine, si elles existent */}
      <ThisWeekEvents events={events} />
    </div>
  );
}
