/* =============================================================================
   Phases d'un événement : Avant · Sur place · Après
   --------------------------------------------------------------------------
   Toute la vie sociale de Rassemble s'organise autour de ces trois moments :
   un salon s'ouvre avant l'événement, vit pendant, et garde la mémoire après.
   Chaque publication est rattachée à la phase dans laquelle elle a été écrite.
   ========================================================================== */

export type EventPhase = "avant" | "live" | "apres";

export const PHASE_LABELS: Record<EventPhase, string> = {
  avant: "Avant l'événement",
  live: "Sur place",
  apres: "Après",
};

/** Ordre d'affichage d'un fil : le plus récent en haut. */
export const PHASE_DISPLAY_ORDER: EventPhase[] = ["apres", "live", "avant"];

export function getEventPhase(
  startAt: string | Date,
  endAt: string | Date,
  at: Date = new Date(),
): EventPhase {
  const time = at.getTime();
  if (time < new Date(startAt).getTime()) return "avant";
  if (time <= new Date(endAt).getTime()) return "live";
  return "apres";
}

/** Libellé court d'état : « Dans 3 jours », « En direct », « Terminé ». */
export function phaseStatus(
  startAt: string | Date,
  endAt: string | Date,
  now: Date = new Date(),
): string {
  const phase = getEventPhase(startAt, endAt, now);
  if (phase === "live") return "En direct";
  if (phase === "apres") return "Terminé";

  const hours = (new Date(startAt).getTime() - now.getTime()) / 3_600_000;
  if (hours < 24) return `Dans ${Math.max(1, Math.round(hours))} h`;
  return `Dans ${Math.ceil(hours / 24)} jours`;
}

/** Tri des salons : en direct, puis à venir (le plus proche d'abord), puis terminés. */
export function comparePhases(
  a: { start_at: string; end_at: string },
  b: { start_at: string; end_at: string },
  now: Date = new Date(),
): number {
  const rank = (event: { start_at: string; end_at: string }) => {
    const phase = getEventPhase(event.start_at, event.end_at, now);
    return phase === "live" ? 0 : phase === "avant" ? 1 : 2;
  };

  const diff = rank(a) - rank(b);
  if (diff !== 0) return diff;

  const startA = new Date(a.start_at).getTime();
  const startB = new Date(b.start_at).getTime();
  // À venir : le plus proche d'abord. Terminés : le plus récent d'abord.
  return rank(a) === 2 ? startB - startA : startA - startB;
}
