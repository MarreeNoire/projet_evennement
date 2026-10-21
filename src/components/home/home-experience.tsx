"use client";

import { CommunityHero } from "./community-hero";
import { TrendingEvents } from "./trending-events";
import { ThisWeekEvents } from "./this-week-events";
import type { PublishedEventView } from "@/types/database";

interface HomeExperienceProps {
  events: PublishedEventView[];
  weekCount: number;
}

export function HomeExperience({ events, weekCount }: HomeExperienceProps) {
  return (
    <div className="home-editorial relative min-h-screen">
      <CommunityHero events={events} weekCount={weekCount} />

      {/* Événements publiés à venir */}
      <TrendingEvents events={events} />

      {/* Sorties de la semaine, si elles existent */}
      <ThisWeekEvents events={events} />
    </div>
  );
}
