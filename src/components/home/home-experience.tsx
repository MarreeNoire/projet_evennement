"use client";

import { CommunityHero } from "./community-hero";
import { TrendingEvents } from "./trending-events";
import { ThisWeekEvents } from "./this-week-events";
import { BecomeOrganizerCTA } from "./become-organizer-cta";
import type { PublishedEventView } from "@/types/database";

interface HomeExperienceProps {
  events: PublishedEventView[];
}

export function HomeExperience({ events }: HomeExperienceProps) {
  return (
    <div className="home-editorial relative min-h-screen">
      <CommunityHero events={events} />

      {/* Événements publiés à venir */}
      <TrendingEvents events={events} />

      {/* Sorties de la semaine, si elles existent */}
      <ThisWeekEvents events={events} />

      <BecomeOrganizerCTA />
    </div>
  );
}
