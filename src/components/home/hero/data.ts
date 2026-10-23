import { CATEGORIES } from "@/lib/constants";
import type { PublicOrganizer } from "@/lib/events/queries";
import type { PublishedEventView } from "@/types/database";

export interface HeroSnapshot {
  totalEvents: number;
  thisWeekEvents: number;
  cityCount: number;
  categoryCount: number;
  categoryTotal: number;
  categoryPercent: number;
  organizerCount: number;
  verifiedOrganizerCount: number;
  recurringOrganizerCount: number;
  recurringPercent: number;
  nextEvent: PublishedEventView | null;
}

/** Fenêtre glissante de 7 jours utilisée pour le compteur « cette semaine ». */
export function getHeroWeekRange(now: number): { startDate: string; endDate: string } {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

interface BuildHeroSnapshotInput {
  events: PublishedEventView[];
  totalEvents: number;
  thisWeekEvents: number;
  organizers: PublicOrganizer[];
  cities: string[];
}

/**
 * Agrège les données publiques réelles de la plateforme pour le hero.
 * Aucune valeur de démonstration : si la base est vide, les compteurs restent à 0.
 */
export function buildHeroSnapshot({
  events,
  totalEvents,
  thisWeekEvents,
  organizers,
  cities,
}: BuildHeroSnapshotInput): HeroSnapshot {
  const categoryCount = new Set(events.map((event) => event.category)).size;
  const categoryTotal = CATEGORIES.length;
  const verifiedOrganizerCount = organizers.filter((organizer) => organizer.verified).length;
  const recurringOrganizerCount = organizers.filter((organizer) => organizer.eventCount > 1).length;

  return {
    totalEvents: Math.max(totalEvents, events.length),
    thisWeekEvents,
    cityCount: cities.length,
    categoryCount,
    categoryTotal,
    categoryPercent:
      categoryTotal > 0 ? Math.min(100, Math.round((categoryCount / categoryTotal) * 100)) : 0,
    organizerCount: organizers.length,
    verifiedOrganizerCount,
    recurringOrganizerCount,
    recurringPercent:
      organizers.length > 0
        ? Math.min(100, Math.round((recurringOrganizerCount / organizers.length) * 100))
        : 0,
    nextEvent: events[0] ?? null,
  };
}
