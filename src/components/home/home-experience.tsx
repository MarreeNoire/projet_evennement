"use client";

import { HeroCarousel3D } from "./hero-carousel-3d";
import { TrendingEvents } from "./trending-events";
import { ThisWeekEvents } from "./this-week-events";
import type { PublishedEventView } from "@/types/database";

interface HomeExperienceProps {
  events: PublishedEventView[];
}

export function HomeExperience({ events }: HomeExperienceProps) {
  return (
    <div className="home-editorial relative min-h-screen">
      <HeroCarousel3D events={events} />

      {/* Événements publiés à venir — le héros les présente sur mobile */}
      <div className="hidden md:block">
        <TrendingEvents events={events} />
      </div>

      {/* Sorties de la semaine, si elles existent */}
      <ThisWeekEvents events={events} />
    </div>
  );
}
